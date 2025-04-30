import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { interceptNavigation } from '../utils/navigation';

const Layout = () => {
  useEffect(() => {
    // Set up global click handler to intercept navigation
    const handleClick = (event) => {
      interceptNavigation(event);
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return <Outlet />;
};

export default Layout;
