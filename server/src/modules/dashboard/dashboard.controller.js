import {
  getAdminDashboard,
  getHRDashboard,
  getEmployeeDashboard,
} from "./dashboard.service.js";

export const adminDashboard = async (req, res, next) => {
  try {
    const data = await getAdminDashboard(req.user.organizationId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const hrDashboard = async (req, res, next) => {
  try {
    const data = await getHRDashboard(req.user.organizationId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const employeeDashboard = async (req, res, next) => {
  try {
    const data = await getEmployeeDashboard(
      req.user.id,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};