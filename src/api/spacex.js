class SpaceX{

    constructor(baseUrl = "https://ll.thespacedevs.com/2.3.0/") {
        this.baseUrl = baseUrl;
    }
    launches(){
        return fetch(`${this.baseUrl}launches`)
            .then(response=>response.json())
    }
    launchpads(){
        return fetch(`${this.baseUrl}pads`)
            .then(response=>response.json())
    }
    launchpad(id){
        return fetch(`${this.baseUrl}pads/${id}`)
            .then(response=>response.json())

    }

}

export {SpaceX}
