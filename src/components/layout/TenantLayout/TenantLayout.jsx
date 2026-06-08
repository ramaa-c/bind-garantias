import React, { useEffect } from "react";
import { useParams, Outlet, Navigate } from "react-router-dom";
import { useChannel, CANALES_MOCK } from "../../../context/ChannelContext";

const TenantLayout = () => {
  const { cadenaSlug } = useParams();
  const { setChannelInfo } = useChannel();

  useEffect(() => {
    if (cadenaSlug && CANALES_MOCK[cadenaSlug]) {
      setChannelInfo(CANALES_MOCK[cadenaSlug]);
    } else {
      setChannelInfo(CANALES_MOCK.default);
    }
  }, [cadenaSlug, setChannelInfo]);

  if (!cadenaSlug) {
    return <Navigate to="/default/login" replace />;
  }

  return <Outlet />;
};

export default TenantLayout;
