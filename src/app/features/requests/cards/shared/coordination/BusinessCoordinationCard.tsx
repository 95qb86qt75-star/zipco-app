import * as React from 'react';
import BusinessCoordinationCardView from './BusinessCoordinationCardView';
import {useBusinessCoordinationCardController} from './application/useBusinessCoordinationCardController';
/** Screen composition only; cards own their complete visual flows. */
export default function BusinessCoordinationCard(props:Parameters<typeof useBusinessCoordinationCardController>[0]){
const model=useBusinessCoordinationCardController(props);
return <BusinessCoordinationCardView model={model}/>;
}
