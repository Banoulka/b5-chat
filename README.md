# b5-chat created for the t3 [cloneathon](https://cloneathon.t3.chat) competition

## MVP

- [x] Chats and converations
- [x] Multiple models & providers to choose from
- [x] Auth users
- [x] Easy to setup and try
- [x] Local chat + sync to server

## Bonus features

- [x] Attachment support (plus model guards)
- [ ] Image-generation support (plus models)
- [x] Syntax code highlighting
- [x] Resumable streams (continue gen after page refresh)
- [ ] Chat branching (alternative conversation paths plus ui)
- [ ] Chat sharing (share chat with link + anonymous)
- [ ] Web search (plus model guard)
- [ ] Reasoning / Web search streaming (thinking phase)
- [ ] BYOK (bring your own key)
- [ ] ~~Mobile app~~

## Bonus bonus features (do you like jazz?)

- [ ] Teams + team workspaces?
- [ ] Chat history export/import
- [ ] API access for devs
- [ ] Custom prompt templates library
- [ ] Dark/light theme toggle

### Useful commands

- Docker compose up

`$ docker compose -f docker/docker-compose.yml up --build -d`

### Known Bugs

- Flashing when resizing text input area (probs due to resize ref thing. need to find fix for this, maybe floating fixed input bar at bottom plus bottom padding on message list instead?)
- Flashing when stream text turns into tanstack text probs can be fixed by streaming directly into query cache?
- Canceling a stream mid work doesnt work and the old data is still persisted for some reason
