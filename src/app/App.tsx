import * as React from 'react';
import AppView from './shell/AppView';
import {useAppController} from './shell/application/useAppController';
/** Screen composition only; cards own their complete visual flows. */
export default function App(){
const model=useAppController();
return <AppView model={model}/>;
}
