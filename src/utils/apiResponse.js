class apiResponse {
    constructor(statuseCode,data , massage = "success"){
        this.statuseCode = statuseCode ; 
        this.data = data ; 
        this.massage = massage ; 
        this.success = statuseCode < 400 ; 

    }
}

export {apiResponse}; 
