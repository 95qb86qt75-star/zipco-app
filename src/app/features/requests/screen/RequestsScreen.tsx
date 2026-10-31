import * as React from 'react';
import RequestsScreenView from './RequestsScreenView';
import {useRequestsScreenController} from './application/useRequestsScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function RequestsScreen(props:Parameters<typeof useRequestsScreenController>[0]){
const model=useRequestsScreenController(props);
return <RequestsScreenView model={model}/>;
}
