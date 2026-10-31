import * as React from 'react';
import AvailabilityPostActionsView from './AvailabilityPostActionsView';
import {useAvailabilityPostActionsController} from './application/useAvailabilityPostActionsController';
/** Composition only; the view owns presentation and the controller owns commands. */
export default function AvailabilityPostActions(props:Parameters<typeof useAvailabilityPostActionsController>[0]){
const model=useAvailabilityPostActionsController(props);
if(model===null)return null;
return <AvailabilityPostActionsView model={model}/>;
}
