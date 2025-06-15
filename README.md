# b5-chat created for the t3 [cloneathon](https://cloneathon.t3.chat) competition

## MVP

- [ ] Chats and converations
- [ ] Multiple models & providers to choose from
- [x] Auth users
- [ ] Easy to setup and try

## Bonus features

- [ ] Attachment support (plus model guards)
- [ ] Image-generation support (plus models)
- [ ] Syntax code highlighting
- [x] Resumable streams (continue gen after page refresh)
- [ ] Chat branching (alternative conversation paths plus ui)
- [ ] Chat sharing (share chat with link + anonymous)
- [ ] Web search (plus model guard)
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

- [x] Model select drop down not following system theme
- [ ] Flashing when resizing text input area (probs due to resize ref thing. need to find fix for this, maybe floating fixed input bar at bottom plus bottom padding on message list instead?) 
- [ ] API strange auth errors on hot reload restart 
