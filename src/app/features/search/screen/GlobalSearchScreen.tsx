import * as React from 'react';
import GlobalSearchScreenView from './GlobalSearchScreenView';
import {useGlobalSearchScreenController} from './application/useGlobalSearchScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function GlobalSearchScreen(props:Parameters<typeof useGlobalSearchScreenController>[0]){
const model=useGlobalSearchScreenController(props);
return <GlobalSearchScreenView model={model}/>;
}
