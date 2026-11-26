import * as React from 'react';
import ReservationWhatsappNavigationHost from '../features/requests/shared/reservations/ReservationWhatsappNavigationHost';


import ActionHologramHost from "../features/requests/shared/feedback/ActionHologram";
import StatusToast from "../features/requests/shared/feedback/StatusToast.tsx";

import Toast from "../shared/notifications/Toast";
import GlobalPullToRefresh from "../shared/pull-to-refresh/GlobalPullToRefresh";

import BusinessNotificationMonitor from "../notifications/BusinessNotificationMonitor";
import { parseNotificationTarget } from "../notifications/notificationNavigation";
import { traceNotificationClick } from "../notifications/notificationClickTrace";

import { noticeWasPresented } from "../notifications/notificationDelivery";



import type {ReactNode} from 'react';
import type {AppModel} from './application/useAppController';
export default function AppShell({model,children:content}:{model:Pick<AppModel,"closeToast"|"handleLogout"|"hasStoredSession"|"openNotificationTarget"|"toast">&{pullToRefresh?:boolean};children:ReactNode}){const {closeToast,handleLogout,hasStoredSession,openNotificationTarget,toast,pullToRefresh=false}=model;
  // Pull to refresh on any screen: remounting the current screen makes it fetch its data
  // again while the navigation (kept above this shell) stays where the user is.
  const [screenRefreshKey,setScreenRefreshKey]=React.useState(0);
  return (<div className="zipco-theme-surface contents">
      <GlobalPullToRefresh disabled={!pullToRefresh} onRefresh={()=>setScreenRefreshKey((key)=>key+1)} />
      <ActionHologramHost />
      <StatusToast />
      <ReservationWhatsappNavigationHost />
      {toast && !noticeWasPresented(toast) && (
        <Toast
          key={toast.dedupeKey}
          notification={toast}
          onClose={closeToast}
          onAction={(value)=>{
            const target=parseNotificationTarget(value,window.location.origin);
            if(import.meta.env.QA_NOTIFICATION_TRACE)traceNotificationClick('toast-click',{hasTarget:!!target,hasEvent:!!target?.eventKey},toast.qaTraceId);
            if(!target)return;
            const url=new URL(target.url,window.location.origin);
            url.searchParams.set('notificationClick',crypto.randomUUID());
            openNotificationTarget(url.pathname+url.search);
          }}
        />
      )}
      {hasStoredSession() && (
        <BusinessNotificationMonitor onSessionExpired={handleLogout} />
      )}
      <React.Fragment key={screenRefreshKey}>{content}</React.Fragment>
    </div>);}
