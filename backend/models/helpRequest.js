export class HelpRequest {
  constructor(question, callerId) {
    this.id = Date.now().toString()        // unique id
    this.question = question
    this.callerId = callerId
    this.status = "pending"
    this.timestamp = new Date().toISOString()
  }
}
