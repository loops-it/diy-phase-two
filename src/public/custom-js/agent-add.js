
// form.addEventListener("submit", () =>{
//     if(password.value != confirm_password.value){
//         document.getElementById('password-error').style.display = 'block';
//         document.getElementById('password-error').phoneContent = 'Passwords dose not match';
//     }
//     else{
//         document.getElementById('password-error').style.display = 'none';
//         document.getElementById('password-error').phoneContent = ''; 

//         const selectedLanguages = Array.from(document.querySelectorAll('#language option:checked')).map(option => option.value);

//         console.log(selectedLanguages);
//         //const formData = new FormData();
//         //formData.append("image", document.getElementById("profile_picture").files[0]);
//         const adminadd = {
//             name: agent_name.value,
//             phone: phone.value,
//             email: email.value,
//             password: password.value,
//             language:  selectedLanguages,
//             user_role: 2
//         }
       
//         fetch("agent-add", {
//             method: "post",
//             body: JSON.stringify(adminadd),
//             headers: {
//                 "Content-Type" : "application/json"
//             }
//         }).then(res => res.json())
//         .then(data => {
        //    if(data.status == "failed"){
        //     success.style.display = "none"
        //     failed.style.display = "block"
        //     failed.innerphone = data.message
        //    }
        //    else{
        //     success.style.display = "block"
        //     failed.style.display = "none"
        //     success.innerphone = data.message
        //    }
//         })
//     }
    
// })





document.getElementById('form').addEventListener('submit', function(event) {
    event.preventDefault(); 
  
    const fileInput = document.getElementById('profile_picture');
    const agent_name = document.getElementById('agent_name').value;
    const selectedLanguages = Array.from(document.querySelectorAll('#language option:checked')).map(option => option.value);
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    const phone = document.getElementById('phone').value;

if(password.value != confirm_password.value){
                document.getElementById('password-error').style.display = 'block';
                document.getElementById('password-error').phoneContent = 'Passwords dose not match';
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
      formData.append('password', password);
      sendToBackend(formData);
    } else {
      const formData = new FormData();
      formData.append('file', "");
      formData.append('name', agent_name);
      formData.append('phone', phone);
      formData.append('language', selectedLanguages);
      formData.append('email', email);
      formData.append('password', password);
      sendToBackend(formData);
    }
}
  });
  
  function sendToBackend(formData) {
    console.log(formData);
    const xhr = new XMLHttpRequest();

    xhr.open('POST', '/agent-add', true);

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