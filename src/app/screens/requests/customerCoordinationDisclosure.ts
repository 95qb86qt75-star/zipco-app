import {createContext,type ReactNode} from 'react';

/** Local layout for the saved negative; never substitutes server permissions. */
export const CustomerCoordinationDisclosure=createContext<{
  expanded:boolean;detailId:string;onOpened:()=>void;secondaryAction:ReactNode;
}|null>(null);
