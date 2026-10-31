import * as React from 'react';
import CustomerReceiptFlowCardView from './CustomerReceiptFlowCardView';
import {useCustomerReceiptFlowCardController} from './application/useCustomerReceiptFlowCardController';
/** Composition only; the view owns presentation and the controller owns commands. */
export default function CustomerReceiptFlowCard(props:Parameters<typeof useCustomerReceiptFlowCardController>[0]){
const model=useCustomerReceiptFlowCardController(props);
return <CustomerReceiptFlowCardView model={model}/>;
}
