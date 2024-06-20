// form.addEventListener("submit", () =>{
//     const selectedLanguages = Array.from(document.querySelectorAll('#language option:checked')).map(option => option.value);
//     if(password.value == "" && confirm_password.value== "" && current_password.value== ""){
//         const user_details = {
//             agent_name: agent_name.value,
//             phone: phone.value,
//             email: email.value,
//             user_id: user_id.value,
//             language:  selectedLanguages,
//         }
        
//         fetch("agent-update", {
//             method: "post",
//             body: JSON.stringify(user_details),
//             headers: {
//                 "Content-Type" : "application/json"
//             }
//         }).then(res => res.json())
//         .then(data => {
//            if(data.status == "failed"){
//             success.style.display = "none"
//             failed.style.display = "block"
//             failed.innerText = data.message
//            }
//            else{
//             success.style.display = "block"
//             failed.style.display = "none"
//             success.innerText = data.message
//            }
//         })
//     }
//     else{
        // if(password.value != confirm_password.value){
        //     document.getElementById('password-error').style.display = 'block';
        //     document.getElementById('password-error').textContent = 'Passwords dose not match';
        // }
        // else{
        // const password_data = {
        //     current_password: current_password.value,
        //     user_id: user_id.value,
        // }
        
//         fetch("user-check-current-password", {
//             method: "post",
//             body: JSON.stringify(password_data),
//             headers: {
//                 "Content-Type" : "application/json"
//             }
//         }).then(res => res.json())
//         .then(data => {
//            if(data.status == "failed"){
//             success.style.display = "none"
//             failed.style.display = "block"
//             failed.innerText = data.message
//            }
//            else{
//             const user_details = {
//                 agent_name: agent_name.value,
//                 phone: phone.value,
//                 email: email.value,
//                 user_id: user_id.value,
//                 password: password.value,
//                 language:  selectedLanguages,
//             }
            
//             fetch("agent-update-with-password", {
//                 method: "post",
//                 body: JSON.stringify(user_details),
//                 headers: {
//                     "Content-Type" : "application/json"
//                 }
//             }).then(res => res.json())
//             .then(data => {
//                if(data.status == "failed"){
//                 success.style.display = "none"
//                 failed.style.display = "block"
//                 failed.innerText = data.message
//                }
//                else{
//                 success.style.display = "block"
//                 failed.style.display = "none"
//                 success.innerText = data.message
//                }
//             })
//            }
//         })
//     }
//     }
// });
// function validateAgent() {
//     const password = document.getElementById("password").value;
//     const confirm_password = document.getElementById("confirm_password").value;
//     const current_password = document.getElementById("current_password").value;
//     if(password == "" && confirm_password == "" && current_password== ""){
        
//     }
//     else{
//         if(password != confirm_password){
//             document.getElementById('password-error').style.display = 'block';
//             document.getElementById('password-error').textContent = 'Passwords dose not match';
//             return false;
//         }
//         else{
//             document.getElementById('password-error').style.display = 'none';
//             document.getElementById('password-error').textContent = ''; 
//         }
//     }
    

// }


document.getElementById('form').addEventListener('submit', function(event) {
    event.preventDefault(); 
  
    const fileInput = document.getElementById('profile_picture');
    const agent_name = document.getElementById('agent_name').value;
    const selectedLanguages = Array.from(document.querySelectorAll('#language option:checked')).map(option => option.value);
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const current_password = document.getElementById('current_password').value;
    const phone = document.getElementById('phone').value;
    const user_id = document.getElementById('user_id').value;

if(password == "" && confirm_password== "" && current_password== ""){
    if (fileInput.files.length > 0) {

        const file = fileInput.files[0];
    
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', agent_name);
        formData.append('phone', phone);
        formData.append('language', selectedLanguages);
        formData.append('email', email);
        formData.append('user_id', user_id);
        agentUpdate(formData);
    } else {
        const formData = new FormData();
        formData.append('file', "");
        formData.append('name', agent_name);
        formData.append('phone', phone);
        formData.append('language', selectedLanguages);
        formData.append('email', email);
        formData.append('user_id', user_id);
        agentUpdate(formData);
    }
}
else{
    if(password != confirm_password){
        document.getElementById('password-error').style.display = 'block';
        document.getElementById('password-error').textContent = 'Passwords dose not match';
    }
    else{
    const password_data = {
        current_password: current_password,
        user_id: user_id,
    }
    
    fetch("user-check-current-password", {
        method: "post",
        body: JSON.stringify(password_data),
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
        if (fileInput.files.length > 0) {

            const file = fileInput.files[0];
        
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', agent_name);
            formData.append('phone', phone);
            formData.append('language', selectedLanguages);
            formData.append('email', email);
            formData.append('user_id', user_id);
            formData.append('password', password);
            agentUpdateWithPassword(formData);
        } else {
            const formData = new FormData();
            formData.append('file', "");
            formData.append('name', agent_name);
            formData.append('phone', phone);
            formData.append('language', selectedLanguages);
            formData.append('email', email);
            formData.append('user_id', user_id);
            formData.append('password', password);
            agentUpdateWithPassword(formData);
        }
       }
    })
}
}
  });
  
  function agentUpdate(formData) {
    console.log(formData);
    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/agent-update', true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const response = JSON.parse(xhr.responseText);
        console.log(response);
        if(response.status == "failed"){
            success.style.display = "none"
            failed.style.display = "block"
            failed.innerText  = response.message
           }
           else{
            success.style.display = "block"
            failed.style.display = "none"
            success.innerText  = response.message
        }
      }
    };
  
    xhr.send(formData);
  }
  function agentUpdateWithPassword(formData) {
    console.log(formData);
    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/agent-update-with-password', true);

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const response = JSON.parse(xhr.responseText);
        console.log(response);
        if(response.status == "failed"){
            success.style.display = "none"
            failed.style.display = "block"
            failed.innerText  = response.message
           }
           else{
            success.style.display = "block"
            failed.style.display = "none"
            success.innerText  = response.message
        }
      }
    };
  
    xhr.send(formData);
  }