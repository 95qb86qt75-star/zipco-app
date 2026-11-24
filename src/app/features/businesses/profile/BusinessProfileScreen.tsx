import * as React from 'react';
import BusinessProfileScreenView from './BusinessProfileScreenView';
import {useBusinessProfileScreenController} from './application/useBusinessProfileScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function BusinessProfileScreen(props:Parameters<typeof useBusinessProfileScreenController>[0]){
const model=useBusinessProfileScreenController(props);
return <BusinessProfileScreenView model={model}/>;
}
