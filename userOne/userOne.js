import { LightningElement, track} from 'lwc';

export default class UserOne extends LightningElement {
    @track messageRec;
    @track messageToSend;
    sendMsg(){
        publish();
    }
}