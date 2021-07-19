import { LightningElement } from 'lwc';

export default class HelloWebComponent extends LightningElement {
    currentDate = new Date().toDateString();
get capitalizedGreeting() {
	return `Hello ${this.greeting}!`;
}
currentDate = new Date().toDateString();
get capitalizedGreeting() {
	return `Hello ${this.greeting}!`;
}
    handleGreetingChange(event) {
        this.greeting = event.target.value;
    }
}