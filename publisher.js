//Dependencies
import { AMQPClient } from '@cloudamqp/amqp-client'
import {} from 'dotenv/config'

async function startPublisher() {
  try {
    //Setup a connection to the RabbitMQ server
    const cloudAMQPURL = process.env.CLOUDAMQP_URL
    const connection = new AMQPClient(cloudAMQPURL)
    await connection.connect()
    const channel = await connection.channel()

    console.log("[✅] Connection over channel established")

    //Declare the exchange and queue, and create a binding between them
    await channel.exchangeDeclare('emails', 'direct')
    const q = await channel.queue('email.notifications')
    await channel.queueBind('email.notifications', 'emails', 'notification')

    //Publish a message to the exchange
    async function sendToQueue(routingKey, email, name, body) {
      const message = { email, name, body }
      const jsonMessage = JSON.stringify(message);

        //amqp-client function expects: publish(exchange, routingKey, message, options)
        await q.publish('emails', { routingKey }, jsonMessage)
        console.log("[📥] Message sent to queue", message)
    }

    //Send some messages to the queue
    sendToQueue("notification", "example@example.com", "John Doe", "Your order has been received");
    sendToQueue("notification", "example@example.com", "Jane Doe", "The product is back in stock");
    sendToQueue("resetpassword", "example@example.com", "Willem Dafoe", "Here is your new password");


   setTimeout(() => {
      //Close the connection
      connection.close()
      console.log("[❎] Connection closed")
      process.exit(0)
    }, 500);
  } catch (error) {
    console.error(error)

    //Retry after 3 second
    setTimeout(() => {
      startPublisher()
    }, 3000)
  }
}

//Last but not least, we have to start the publisher and catch any errors
startPublisher()