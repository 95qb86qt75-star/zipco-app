import * as React from 'react';
import BusinessConfigScreenView from './BusinessConfigScreenView';
import {useBusinessConfigScreenController} from './application/useBusinessConfigScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function BusinessConfigScreen(props:Parameters<typeof useBusinessConfigScreenController>[0]){
const model=useBusinessConfigScreenController(props);
return <BusinessConfigScreenView model={model}/>;
}
