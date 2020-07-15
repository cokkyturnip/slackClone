class Namespace{
    constructor(id, nsTitle, img, endpoint){
        this.id = id;
        this.img = img;
        this.nsTitle = nsTitle;
        this.endpoint = endpoint;
        this.rooms = [];
    }

    addRoom(roomObj){
        this.rooms = [...this.rooms, roomObj];
    }

}

module.exports = Namespace;