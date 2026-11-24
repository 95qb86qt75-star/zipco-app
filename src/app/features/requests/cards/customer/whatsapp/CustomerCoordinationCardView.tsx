import * as React from 'react';
import CustomerCoordinationQuestionCard from './CustomerCoordinationQuestionCard';
import CustomerWhatsappProgressCard from '../progress/CustomerWhatsappProgressCard';
import type {CustomerCoordinationCardModel} from './application/useCustomerCoordinationCardController';
/** Selection only: no duplicated presentation branches. */
export default function CustomerCoordinationCardView({model}:{model:CustomerCoordinationCardModel}){return model.own?<CustomerWhatsappProgressCard model={model}/>:<CustomerCoordinationQuestionCard model={model}/>;}
