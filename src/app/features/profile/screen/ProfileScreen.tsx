import * as React from 'react';
import ProfileScreenView from './ProfileScreenView';
import {useProfileScreenController} from './application/useProfileScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function ProfileScreen(props:Parameters<typeof useProfileScreenController>[0]){
const model=useProfileScreenController(props);
return <ProfileScreenView model={model}/>;
}
