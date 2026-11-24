import * as React from 'react';
import NegociosScreenView from './NegociosScreenView';
import {useNegociosScreenController} from './application/useNegociosScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function NegociosScreen(props:Parameters<typeof useNegociosScreenController>[0]){
const model=useNegociosScreenController(props);
return <NegociosScreenView model={model}/>;
}
