import { configureStore } from "@reduxjs/toolkit";
import auth from "../features/auth/authSlice";

export default configureStore({ reducer: { auth } });
