import * as React from 'react';


import ActionHologramHost from "../features/requests/shared/feedback/ActionHologram";
import StatusToast from "../features/requests/shared/feedback/StatusToast.tsx";

import Toast from "../shared/notifications/Toast";

import BusinessNotificationMonitor from "../notifications/BusinessNotificationMonitor";
import { parseNotificationTarget } from "../notifications/notificationNavigation";
import { traceNotificationClick } from "../notifications/notificationClickTrace";

import { noticeWasPresented } from "../notifications/notificationDelivery";



import type {ReactNode} from 'react';
import type {AppModel} from './application/useAppController';
export default function AppShell({model,children:content}:{model:Pick<AppModel,"closeToast"|"handleLogout"|"hasStoredSession"|"openNotificationTarget"|"toast">;children:ReactNode}){const {closeToast,handleLogout,hasStoredSession,openNotificationTarget,toast}=model;return (<div className="zipco-theme-surface contents">
      <ActionHologramHost />
      <StatusToast />
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
      {content}
    </div>);}
