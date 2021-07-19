import { LightningElement,track,wire } from 'lwc';
import getRate from '@salesforce/apex/CurrencyExchange.getRate';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { publish, MessageContext } from 'lightning/messageService';
import CONVERTED_RATE from '@salesforce/messageChannel/Exchange_Result__c';

export default class CurrencyExchange extends LightningElement {
    @track toCur;
    @track fromCur;
    @track value=0;
    @track amount=0;
    @track error;

    @wire(MessageContext)
    messageContext;

    changetoCur(event){
        this.toCur=event.detail.value;
    }
    
    changeFromCur(event){
        this.fromCur=event.detail.value;
    }
    changeValue(event){
        this.value=event.detail.value;
    }
    handleClick(){
        this.convert();

    }
    
    convert(){
        try{
        console.log('coverting');
    
        getRate({ fromCur: this.fromCur,toCur : this.toCur , value: this.value  })
            .then((result) => {
                    this.amount = result;
                    console.log('get rate called amount :'+this.amount+' result :'+result);
                    this.error = undefined;
                    this.publishResult();
            })
            .catch((error) => {
                this.error = error;
                this.amount = undefined;
                const event = new ShowToastEvent({
                    title: '404:  Data Not Found',
                    message: 'no Data available for given currency type, please try again later',
                });
                this.dispatchEvent(event);
            });
            
        /*console.log("publishResult called with values :"+this.value+" and "+this.amount);
        // this.counter--;
        const payload = { 
            value: this.value,
            amount: this.amount,
            fromCur:this.fromCur,
            toCur:this.toCur
        };
        console.log("publishing message");
        publish(this.messageContext, CONVERTED_RATE, payload);
        console.log("message published successfully");*/
    }catch(Exception){
        console.log(Exception);
    }
    }
    publishResult(){
        console.log("publishResult called with values :"+this.value+" , "+this.amount+" , "+this.fromCur+" and "+this.toCur+"  ");
        // this.counter--;
        const payload = { 
            value: this.value,
            amount: this.amount,
            fromCur:this.fromCur,
            toCur:this.toCur
        };
        console.log("publishing message");
        publish(this.messageContext, CONVERTED_RATE, payload);
        console.log("message published successfully");
    }
}