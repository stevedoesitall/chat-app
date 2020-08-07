const socket = io()

//Elements
const messageButton = document.querySelector('#chat')
const locationButton = document.querySelector('#share-location')
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

const autoScroll = () => {
    //New message element
    const newMessage = messages.lastElementChild

    //Height of new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = messages.offsetHeight

    //Height of messages container
    const containerHeight = messages.scrollHeight

    //Gives how far the user has scrolled
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm:ss a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

console.log(username, room)

socket.on('location', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        location: message.url,
        createdAt: moment(message.createdAt).format('h:mm:ss a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', (data) => {
    const html = Mustache.render(sidebarTemplate, {
        room: data.room,
        users: data.users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    messageButton.setAttribute('disabled', 'disabled')

    const messageText = document.querySelector('#message').value
    socket.emit('sendMessage', messageText, (error) => {
        messageButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()

        if (error) {
            return console.log(error)
        }
        console.log('Message delivered')
    })
})

locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            locationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})