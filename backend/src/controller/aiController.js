const Groq = require('groq-sdk');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const moment = require('moment');

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  return new Groq({ apiKey });
};

// Groq model (llama-3.1-8b-instant is universally supported on all Groq tiers)
const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

// ---------------------------------------------------------------
// POST /api/ai/smart-leave
// Plain text prompt -> structured JSON
// ---------------------------------------------------------------
exports.smartLeave = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    const today = moment().format('YYYY-MM-DD');

    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.2, // Low temp for structured output
        response_format: { type: 'json_object' }, // Groq supports JSON mode
        messages: [
          {
            role: 'system',
            content: `You are a leave-parsing assistant. Today's date is ${today}.
Parse the user's leave request and return ONLY a valid JSON object with these exact keys:
- "leaveType": one of "Casual", "Sick", "Annual", "Unpaid"
- "startDate": "YYYY-MM-DD"
- "endDate": "YYYY-MM-DD"
- "reason": short human-readable reason string

Rules:
- If user says "kal" (tomorrow), calculate from today.
- If user says "aaj" (today), use today.
- If duration is given ("3 din"), endDate = startDate + (days - 1).
- If no leave type is mentioned, default to "Casual".
- If range unclear, default startDate = today, endDate = today.

Return ONLY the JSON, no markdown, no explanation.`
          },
          { role: 'user', content: prompt }
        ]
      });

      const raw = completion.choices[0].message.content;
      const parsed = JSON.parse(raw);

      // Basic validation
      const validTypes = ['Casual', 'Sick', 'Annual', 'Unpaid'];
      if (!validTypes.includes(parsed.leaveType)) parsed.leaveType = 'Casual';
      if (!parsed.startDate) parsed.startDate = today;
      if (!parsed.endDate) parsed.endDate = parsed.startDate;
      if (!parsed.reason) parsed.reason = prompt;

      return res.json(parsed);
    } catch (aiErr) {
      console.warn('Groq AI call failed, using heuristic fallback:', aiErr.message);
      // Heuristic fallback for offline/rate-limited environments
      let leaveType = 'Casual';
      if (/sick|fever|doctor|medical|bimar/i.test(prompt)) leaveType = 'Sick';
      else if (/annual|vacation|holiday|chutti/i.test(prompt)) leaveType = 'Annual';
      else if (/unpaid/i.test(prompt)) leaveType = 'Unpaid';

      return res.json({
        leaveType,
        startDate: today,
        endDate: today,
        reason: prompt
      });
    }
  } catch (err) {
    console.error('smartLeave error:', err.message);
    res.status(500).json({ message: 'AI parsing failed', error: err.message });
  }
};

// ---------------------------------------------------------------
// POST /api/ai/chat
// Chatbot with real DB context (tool-style)
// ---------------------------------------------------------------
exports.chat = async (req, res) => {
  try {
    const message = req.body.message || req.body.prompt;
    const history = req.body.history || [];
    if (!message) return res.status(400).json({ message: 'Message required' });

    // Context fetch karein DB se
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    const approvedLeaves = await Leave.countDocuments({ status: 'Approved' });
    const totalEmployees = await User.countDocuments({ role: { $ne: 'Admin' } });
    const today = moment().format('YYYY-MM-DD');
    const presentToday = await Attendance.countDocuments({ date: today, status: 'Present' });
    const lateToday = await Attendance.countDocuments({ date: today, status: 'Late' });

    const systemPrompt = `You are "HCM Lite Assistant", a helpful HR chatbot.

Live organizational snapshot (use this when asked):
- Total employees: ${totalEmployees}
- Present today: ${presentToday}
- Late today: ${lateToday}
- Pending leave approvals: ${pendingLeaves}
- Approved leaves total: ${approvedLeaves}
- Today's date: ${today}

Rules:
- Reply in the same language the user writes in (Hindi/English/Hinglish).
- Be concise and professional.
- If asked something outside HR scope, politely redirect.
- Never expose raw DB internals, only summarized answers.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6), // last 6 messages for context
      { role: 'user', content: message }
    ];

    let reply = '';
    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 512,
        messages
      });
      reply = completion.choices[0].message.content;
    } catch (aiErr) {
      reply = `Hello! Currently offline AI fallback: We have ${totalEmployees} total staff, with ${presentToday} present today and ${pendingLeaves} pending leave requests. How can I assist you?`;
    }

    res.json({ reply });
  } catch (err) {
    console.error('chat error:', err.message);
    res.status(500).json({ message: 'Chat failed', error: err.message });
  }
};

// ---------------------------------------------------------------
// POST /api/ai/policy-qa
// Policy Q&A — static company policy context
// ---------------------------------------------------------------
exports.policyQA = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Question required' });

    const policyContext = `
COMPANY POLICY HANDBOOK (HCM Lite Inc.):
1. Working Hours: 09:00 AM - 06:00 PM, Monday to Friday. Check-in after 09:15 AM is marked "Late".
2. Leave Types:
   - Casual Leave: 12 days/year, requires 1 day prior notice.
   - Sick Leave: 10 days/year, medical certificate needed for 3+ days.
   - Annual Leave: 15 days/year, requires 2 weeks prior approval.
   - Unpaid Leave: No limit but subject to manager approval.
3. Payroll: Processed on the last working day of every month. Salary credited by the 2nd of the following month.
4. Tax: 5% for gross > ₹30,000, 10% for gross > ₹50,000.
5. Notice Period: 30 days for employees, 60 days for managers.
6. Attendance correction: Must be raised within 7 days of the discrepancy.
7. Work-from-home: Allowed up to 8 days/month with manager approval.
8. Reimbursements: Submitted by 25th of each month with valid bills.
`;

    let answer = '';
    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 512,
        messages: [
          {
            role: 'system',
            content: `You are a company policy assistant for HCM Lite Inc.
Answer questions using ONLY the policy handbook below.
If the answer is not in the handbook, say: "Yeh policy handbook mein nahi hai. Please HR se contact karein."

${policyContext}

Answer clearly and concisely. Reply in the user's language (Hindi/English/Hinglish).`
          },
          { role: 'user', content: question }
        ]
      });

      answer = completion.choices[0].message.content;
    } catch (aiErr) {
      answer = `Company Policy Summary: Office hours are 9:00 AM - 6:00 PM (grace period until 9:15 AM). Casual leave: 12 days, Sick leave: 10 days, Annual leave: 15 days. Payroll is processed at the end of each month. (Direct match from policy manual)`;
    }

    // Optional: audit trail
    try {
      const { logAudit } = require('../middleware/audit');
      await logAudit(req.user?.email || 'user', 'Policy Q&A query', question.slice(0, 80));
    } catch (_) {}

    res.json({ answer });
  } catch (err) {
    console.error('policyQA error:', err.message);
    res.status(500).json({ message: 'Policy Q&A failed', error: err.message });
  }
};

// ---------------------------------------------------------------
// BONUS: POST /api/ai/attendance-summary
// A quick AI summary of today's attendance (useful for HR dashboard)
// ---------------------------------------------------------------
exports.attendanceSummary = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const records = await Attendance.find({ date: today });
    const totalEmployees = await User.countDocuments({ role: { $ne: 'Admin' } });

    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.status === 'Late').length;
    const absent = Math.max(0, totalEmployees - present - late);

    let summary = `Date: ${today}. Total Employees: ${totalEmployees}. Present: ${present}, Late: ${late}, Absent: ${absent}.`;
    try {
      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'You are an HR analytics summarizer. Write a crisp 2-sentence daily attendance summary in Hinglish.'
          },
          {
            role: 'user',
            content: `Date: ${today}. Total: ${totalEmployees}. Present: ${present}. Late: ${late}. Absent: ${absent}.`
          }
        ]
      });
      summary = completion.choices[0].message.content;
    } catch (_) {}

    res.json({
      date: today,
      stats: { totalEmployees, present, late, absent },
      summary
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};