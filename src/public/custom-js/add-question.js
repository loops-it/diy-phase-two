
form.addEventListener("submit", () =>{

    const questionadd = {
        question: question.value,
        intent: intent.value,
        language: language.value,
    }
   
    fetch("add-question", {
        method: "post",
        body: JSON.stringify(questionadd),
        headers: {
            "Content-Type" : "application/json"
        }
    }).then(res => res.json())
    .then(data => {
       if(data.status == "failed"){
        success.style.display = "none"
        failed.style.display = "block"
        failed.innerText = data.message
       }
       else{
        success.style.display = "block"
        failed.style.display = "none"
        success.innerText = data.message
       }
    })

})





