import { useContext } from 'react';
import { AdminToastContext } from './AdminToastContext';

export function useAdminToast() {
  return useContext(AdminToastContext);
}
