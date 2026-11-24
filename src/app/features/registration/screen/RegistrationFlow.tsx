import * as React from 'react';
import RegistrationFlowView from './RegistrationFlowView';
import {useRegistrationFlowController} from './application/useRegistrationFlowController';
/** Screen composition only; cards own their complete visual flows. */
export default function RegistrationFlow(props:Parameters<typeof useRegistrationFlowController>[0]){
const model=useRegistrationFlowController(props);
return <RegistrationFlowView model={model}/>;
}
