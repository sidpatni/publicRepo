import { LightningElement,track,wire } from 'lwc';
import { subscribe, MessageContext,APPLICATION_SCOPE } from 'lightning/messageService';
import CONVERTED_RATE from '@salesforce/messageChannel/Exchange_Result__c';

export default class ResultOfCurrencyExchange extends LightningElement {
    @track amount=0;
    @track subscription=null;
    @track value=0;
    @track toCur;
    @track fromCur;
    @track flag=false;
    @wire(MessageContext)
    messageContext;
    
    subscribeToMessageChannel() {
    console.log("subscribeToMessageChannel called and message subscribed ");
    this.subscription = subscribe(
        this.messageContext,
        CONVERTED_RATE,
        (message) => this.handleMessage(message)
    );
    console.log("this.amount in comp2:"+this.amount);
    console.log("this.value  in comp2:"+this.value);
    }
    handleMessage(message) {
        console.log("handleMessage Called comp2 and value are :"+message.amount+" ,  "+message.value+","+message.fromCur+" and "+message.toCur );
        this.amount=message.amount;
        this.value=message.value;
        this.toCur=message.toCur;
        this.fromCur=message.fromCur;
        console.log("handleMessage Call over comp2 and now value are :"+message.amount+"   "+message.value+":)");
        console.log("this.Var value are :"+this.amount+"   "+this.value+":)"+this.fromCur+" ,"+this.toCur);
        this.flag=true;
    }
    connectedCallback() {
        this.subscribeToMessageChannel();
    }
}