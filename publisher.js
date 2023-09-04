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
    await channel.exchangeDeclare('exchange.26a7a847-f8df-4d43-b076-1ffb2e55556d', 'direct')
    const q = await channel.queue('exam')
    await channel.queueBind('exam', 'exchange.26a7a847-f8df-4d43-b076-1ffb2e55556d', '26a7a847-f8df-4d43-b076-1ffb2e55556d')

    //Publish a message to the exchange
    async function sendToQueue(routingKey, payload) {
      const message = { payload }
      const jsonMessage = JSON.stringify(message);

        //amqp-client function expects: publish(exchange, routingKey, message, options)
        await channel.basicPublish('exchange.26a7a847-f8df-4d43-b076-1ffb2e55556d', '26a7a847-f8df-4d43-b076-1ffb2e55556d', 'Hi CloudAMQP, this was fun!',  { deliveryMode: 2 })
        console.log("[📥] Message sent to queue", message)
    }

    //Send some messages to the queue
    sendToQueue("26a7a847-f8df-4d43-b076-1ffb2e55556d", "Hi CloudAMQP, this was fun!");

    await channel.queueUnbind('exam', 'exchange.26a7a847-f8df-4d43-b076-1ffb2e55556d', '26a7a847-f8df-4d43-b076-1ffb2e55556d')
    //await channel.exchangeDelete('exchange.26a7a847-f8df-4d43-b076-1ffb2e55556d', false)
        

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