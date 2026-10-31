import * as React from 'react';
import BusinessProgressCardView from './BusinessProgressCardView';
import {useBusinessProgressCardController} from './application/useBusinessProgressCardController';
/** Screen composition only; cards own their complete visual flows. */
export default function BusinessProgressCard(props:Parameters<typeof useBusinessProgressCardController>[0]){
const model=useBusinessProgressCardController(props);
return <BusinessProgressCardView model={model}/>;
}
