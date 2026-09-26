import React, { useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/auth/actions";
import { Navigate } from "react-router-dom";

const Logout: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(logout());
  }, [dispatch]);

  return <Navigate to="/" />;
};

export default Logout;
