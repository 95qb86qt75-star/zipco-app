import SelectedProductCard from '../cards/SelectedProductCard';
import * as React from 'react';
















import type { CheckoutScreenModel } from "../application/useCheckoutScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function ProductSelectionCard({model}:{model:Pick<CheckoutScreenModel,"quantities"|"selectedItems"|"updateQuantity">}){
const {quantities,selectedItems,updateQuantity}=model;
return (<div className="mb-4 space-y-2">
          {selectedItems.map((product)=><SelectedProductCard key={product.id} product={product} model={{quantities,updateQuantity}}/>)}
        </div>);
}
