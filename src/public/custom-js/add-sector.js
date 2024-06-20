
form.addEventListener("submit", () =>{

        const adminadd = {
            sector_name: sector_name.value,
            email: email.value,
        }
       
        fetch("add-sector", {
            method: "post",
            body: JSON.stringify(adminadd),
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





