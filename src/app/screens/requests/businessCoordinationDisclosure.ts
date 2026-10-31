import {createContext,type ReactNode} from 'react';

export const BusinessCoordinationDisclosure=createContext<{
  expanded:boolean;detailId:string;secondaryAction:ReactNode;
}|null>(null);
