function setFormattedOpenedTime() {
  const OpenedTime = new Date();
  let Opendhours = OpenedTime.getHours();
  const Openedminutes = OpenedTime.getMinutes().toString().padStart(2, "0");
  const Openedseconds = OpenedTime.getSeconds().toString().padStart(2, "0");
  const Openedampm = Opendhours >= 12 ? "PM" : "AM";
  Opendhours = Opendhours % 12;
  Opendhours = Opendhours ? Opendhours : 12; // the hour '0' should be '12'
  const formattedOpenedTime = `${Opendhours.toString().padStart(
    2,
    "0"
  )}:${Openedminutes} ${Openedampm}`;

  document.getElementById("OpenedTime2").textContent = formattedOpenedTime;
}

// Call the function to set the time
setFormattedOpenedTime();


// Define global variables
let chatHistory = [];
let messageDiv;
let chatWithAgent = false;
let chatTimeoutId;
let endChatAlertShown = false;
let ratingVisible = false;

// Event listener to clear localStorage items on browser refresh
window.addEventListener("beforeunload", function (event) {
  localStorage.removeItem("selectedLanguage");
  localStorage.removeItem("chatId");
});

// Function to initialize typing animation
function showTypingAnimation() {
  const responseDiv = document.getElementById("response");
  const typingMessage = document.createElement("div");
  typingMessage.classList.add("bot-message");
  typingMessage.innerHTML = `
            <div class="typing-animation typingmsg-wrapper">
                <i class="bi bi-three-dots loading typing-msg"></i>
            </div>
            `;
  responseDiv.appendChild(typingMessage);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

// Function to remove typing animation
function hideTypingAnimation() {
  const typingMessage = document.querySelector(".typing-animation");
  if (typingMessage) {
    typingMessage.remove();
  }
}

// Function to handle error messages
function handleErrorMessage(error) {
  const responseDiv = document.getElementById("response");
  console.log("error response : ", responseDiv)
  let errorMessage =
    "<p class='error-message'>The allocated number of tokens are over, please ask the administrator to add more tokens to the system.</p>"; // Default error message

  // Check if the error message matches the specific error condition
  if (
    error.message ===
    "The allocated number of tokens are over, please ask the administrator to add more tokens to the system."
  ) {
    errorMessage =
      "<p>The allocated number of tokens are over, please ask the administrator to add more tokens to the system.</p>";
  }

  // else{
  //   errorMessage =
  //     `<div class="d-flex flex-column justify-content-center align-items-center bg-danger">
  //         <p>We are currently busy. Please try again..</p>
  //         <a href="https://dfcc.vercel.app/">Go back to chat</a>
  //     </div>`;
  // }
  responseDiv.innerHTML = errorMessage;
}

// Function to start chat timeout
function startChatTimeout() {
  chatTimeoutId = setTimeout(showEndChatAlert, 150000);
}

// Function to reset chat timeout
function resetChatTimeout() {
  clearTimeout(chatTimeoutId);
  startChatTimeout();
}

// Function to show end chat alert
function showEndChatAlert() {
  if (!endChatAlertShown) {
    // Check if the alert has not been shown
    endChatAlertShown = true; // Set the flag to true to indicate the alert has been shown

    const responseDiv = document.getElementById("response");
    const alertDiv = document.createElement("div");
    alertDiv.classList.add(
      "alert",
      "alert-warning",
      "alert-dismissible",
      "fade",
      "show"
    );
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerHTML = `
            It seems you haven't sent a message for a while. Do you want to end the chat?
            <div class="d-flex flex-row">
              <button type="button" class="btnNotoClose ms-2" data-bs-dismiss="alert">Cancel</button>
            </div>
        `;
    responseDiv.appendChild(alertDiv);
    alertDiv.scrollIntoView({ behavior: "smooth" });
  }
}

function showEndChatAlertAgent() {
  if (!endChatAlertShown) {
    // Check if the alert has not been shown
    endChatAlertShown = true; // Set the flag to true to indicate the alert has been shown

    const responseDiv = document.getElementById("response");
    const alertDiv = document.createElement("div");
    alertDiv.classList.add(
      "alert",
      "alert-warning",
      "alert-dismissible",
      "fade",
      "show"
    );
    alertDiv.setAttribute("role", "alert");
    if (ratingVisible === true) {
      alertDiv.innerHTML = `
      Are you sure yo want to colse this chat. Do you want to end the chat?
      <div class="d-flex flex-row">
        <button type="button" class="btnNotoClose ms-2" data-bs-dismiss="alert">Cancel</button>
      </div>
  `;
    } else {
      alertDiv.innerHTML = `
      Are you sure yo want to colse this chat. Do you want to end the chat?
      <div class="d-flex flex-row">
        <button type="button" class="btnYesToClose btn-end-chat">Yes</button>
        <button type="button" class="btnNotoClose ms-2" data-bs-dismiss="alert">Cancel</button>
      </div>
  `;
    }

    responseDiv.appendChild(alertDiv);
    alertDiv.scrollIntoView({ behavior: "smooth" });

    // Add event listener for the "Yes" buttons
    if (ratingVisible === false) {
      const endChatButton = alertDiv.querySelector(".btn-end-chat");
      endChatButton.addEventListener("click", handleEndChat);
      ratingVisible === true;
    }
  }
}

function showEndChatAlertBot() {
  if (!endChatAlertShown) {
    // Check if the alert has not been shown
    endChatAlertShown = true; // Set the flag to true to indicate the alert has been shown

    const responseDiv = document.getElementById("response");
    const alertDiv = document.createElement("div");
    alertDiv.classList.add(
      "alert",
      "alert-warning",
      "alert-dismissible",
      "fade",
      "show"
    );
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerHTML = `
              Are you sure yo want to colse this chat. Do you want to end the chat?
              <div class="d-flex flex-row">
                <button type="button" class="btnYesToClose btn-end-chat">Yes</button>
                <button type="button" class="btnNotoClose ms-2" data-bs-dismiss="alert">Cancel</button>
              </div>
          `;
    responseDiv.appendChild(alertDiv);
    alertDiv.scrollIntoView({ behavior: "smooth" });

    // Add event listener for the "Yes" buttons
    const endChatButton = alertDiv.querySelector(".btn-end-chat");
    endChatButton.addEventListener("click", handleEndChatBot);
  }
}
function handleEndChatBot() {

  // Show star rating form message
  showAlertSuccess('Thank you for chatting with us.')
}

// Function to handle ending the chat
function handleEndChat() {
  // Clear the chat timeout
  clearTimeout(chatTimeoutId);

  // Show star rating form message
  appendMessageToResponse(
    "rate",
    "Please rate your chat experience:",
    null,
    true
  );
}

// Function to append message to response div
function appendMessageToResponse(role, content, data, isRatingForm = false) {
  const responseDiv = document.getElementById("response");
  // const messageDiv = createMessageDiv(role, content);
  // const image = createMessageImage(role);

  const messageDiv = createMessageDiv(isRatingForm ? "rate" : role, content);
  const image = createMessageImage(isRatingForm ? "rate" : role);

  if (isList(content)) {
    appendListContent(messageDiv, content);
  } else if (
    content.includes(
      "I'm sorry.. no information documents found for data retrieval."
    )
  ) {
    appendLiveAgentContent(messageDiv, content, data);
  }
  // else if (!chatWithAgent && data && data.productOrService && !data.productOrService.includes("not a product")) {
  //     appendProductContent(messageDiv, content, data);
  // }
  else {
    appendPlainTextContent(messageDiv, content);
  }

  if (isRatingForm) {
    appendRatingForm(messageDiv, content);
  }

  resetChatTimeout();

  messageDiv.prepend(image);
  responseDiv.appendChild(messageDiv);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

// function createMessageDiv(role, content) {
//     const messageDiv = document.createElement("div");
//     messageDiv.classList.add(role === "user" ? "user-message" : "bot-message");
//     return messageDiv;
// }
function createMessageDiv(role, content) {
  const messageDiv = document.createElement("div");

  // Add class based on the role
  if (role === "user") {
    messageDiv.classList.add("user-message");
  } else if (role === "bot") {
    messageDiv.classList.add("bot-message");
  } else if (role === "product") {
    messageDiv.classList.add("product-message");
  } else if (role === "liveagent") {
    messageDiv.classList.add("bot-message");
  } else if (role === "rate") {
    messageDiv.classList.add("rate-message");
  }

  // Optionally, add the content to the messageDiv
  messageDiv.textContent = content;

  return messageDiv;
}

let liveAgentImage = null;
function createMessageImage(role) {
  const image = document.createElement("img");
  image.classList.add("message-image");
  // image.src = role === "user" ? "/user.webp" : "/agent.png";
  // image.src = role === "user"
  //   ? "/user.webp"
  //   : role === "liveagent"
  //     ? liveAgentImage
  //     : "/agent.png";

  image.src = role === "user"
    ? "/user.webp"
    : role === "liveagent" || role === "rate"
      ? liveAgentImage
      : "/agent.png";


  return image;
}

function isList(content) {
  const listRegex = /^\d+\.\s.*$/gm;
  return listRegex.test(content);
}

function appendListContent(messageDiv, content) {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours
    .toString()
    .padStart(2, "0")}:${minutes} ${ampm}`;

  const listItems = content
    .split("\n")
    .map((item) => `<li style="margin-bottom: 10px !important;">${item}</li>`)
    .join("");
  messageDiv.innerHTML = `<div class="messageWrapper">
    <span class="botname-message">${formattedTime}</span>
    <div>
      <ul style="list-style: none; padding: 0px !important">${listItems}</ul>
    </div>
  </div>`;
}

function appendLiveAgentContent(messageDiv, content, data) {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours
    .toString()
    .padStart(2, "0")}:${minutes} ${ampm}`;

  messageDiv.innerHTML = `<div class="messageWrapper">
    <span class="botname-message">${formattedTime}</span>
    <div class="d-flex flex-column">
        <button id="LiveAgentButton" class="liveagentBtn">Chat with live agent</button>
      <div>${content}</div>
    </div>
  </div>
      `;
  const liveAgentButton = messageDiv.querySelector("#LiveAgentButton");
  liveAgentButton.addEventListener("click", handleLiveAgentButtonClick(data));
}

let chatStatus = 'bot';

function handleLiveAgentButtonClick(data) {
  return async function () {
    try {
      const switchResponse = await fetch("/switch-to-live-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId: data.chatId }),
      });
      const dataSwitchAgent = await switchResponse.json();
      console.log("switch res : ", dataSwitchAgent);
      if (dataSwitchAgent.status === "success") {
        showAlert(`One of our agents will join you soon. we have ${dataSwitchAgent.queued_chats} Please stay tuned.`);
        chatWithAgent = true;
        startCheckingForAgent(data);
      } else {
        // Show offline form
        showOfflineForm();
      }

    } catch (error) {
      console.error("Error switching to live agent:", error);
    }
  };
}

function showOfflineForm() {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours
    .toString()
    .padStart(2, "0")}:${minutes} ${ampm}`;
  const responseDiv = document.getElementById("response");
  const offlineForm = document.createElement("div");
  offlineForm.classList.add("bot-message");

  const image = document.createElement("img");
  image.classList.add("message-image");
  image.src = "/agent.png";

  const offlineFormHTML = `
        <div class="p-2 mt-2">
            <form id="offlineForm">
                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control" id="name" required>
                </div>
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                    <label for="subject" class="form-label">Subject</label>
                    <input type="text" class="form-control" id="subject" required>
                </div>
                <div class="mb-3">
                    <label for="message" class="form-label">Message</label>
                    <textarea class="form-control" id="message" rows="3" required></textarea>
                </div>
                <button type="submit" class="btnRatingView">Submit</button>
            </form>
        </div>
    `;

  offlineForm.innerHTML = `<div class="messageWrapper">
    <span class="botname-message">${formattedTime}</span>
    <div class="ratingFormTest">
      <p class="mb-0">Our agents are offline. Please submit your message:</p>
    </div>
    ${offlineFormHTML}
  </div>`;
  offlineForm.prepend(image);

  responseDiv.appendChild(offlineForm);

  // Scroll to the form
  offlineForm.scrollIntoView({ behavior: "smooth", block: "end" });

  // Add event listener for form submission
  const offlineFormElement = document.getElementById("offlineForm");
  offlineFormElement.addEventListener("submit", handleOfflineFormSubmission);
}

async function handleOfflineFormSubmission(event) {
  event.preventDefault();

  const chatId = localStorage.getItem("chatId");
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("message").value;
  let selectedLanguage = "";

  const selectedLanguageLocal = localStorage.getItem("selectedLanguage");
  if (selectedLanguageLocal === "singlish") {
    selectedLanguage = "sinhala";
  } else if (selectedLanguageLocal === "tanglish") {
    selectedLanguage = "tamil";
  } else {
    selectedLanguage = selectedLanguageLocal;
  }

  try {
    const response = await fetch("/live-chat-offline-form", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        name,
        email,
        subject,
        message,
        language: selectedLanguage,
      }),
    });

    const responseOfflineForm = await response.json();
    if (responseOfflineForm.status === "success") {
      showAlertSuccess(
        "Your message has been submitted successfully. Our team will get back to you soon."
      );
    } else {
      showAlert("Failed to submit your message. Please try again later.");
    }
  } catch (error) {
    console.error("Error submitting offline form:", error);
    showAlert(
      "An error occurred while submitting your message. Please try again later."
    );
  }
}


let intervalId;
let agentJoined = false;

function startCheckingForAgent(data) {
  intervalId = setInterval(async () => {
    try {
      // if (chatStatus === "null"){
      const response = await fetch("/live-chat-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId: data.chatId }),
      });

      const dataLiveAgent = await response.json();
      console.log("response Data agent --: ", dataLiveAgent);

      if (response.ok) {
        console.log("responseData agent: ", dataLiveAgent);
        chatStatus = dataLiveAgent.chat_status;
        if (dataLiveAgent.chat_status === "live") {
          console.log("response.status - ", dataLiveAgent.chat_status);
          if (dataLiveAgent.agent_id !== "unassigned") {
            if (!agentJoined) {
              showAlert(
                "Now you are chatting with agent ID: " +
                dataLiveAgent.agent_name
              );
              liveAgentImage = dataLiveAgent.profile_picture;
              agentJoined = true;
              chatWithAgent = true;
            }
            appendMessageToResponse(
              "liveagent",
              dataLiveAgent.agent_message,
              data
            );
          }
        } else if (dataLiveAgent.chat_status === "closed") {
          console.log("response.status failed - ", dataLiveAgent.chat_status);
          if (ratingVisible === false) {
            handleEndChat();
            ratingVisible === true;
          }

          chatWithAgent = false;
          clearInterval(intervalId); // Stop sending requests if the chat is closed
        }
      }
      // }

    } catch (error) {
      console.error("Error fetching products data:", error);
    }
  }, 5000);

  setTimeout(() => {
    clearInterval(intervalId);
    if (!agentJoined) {
      showAlert("All agents are busy. Please try again later.");
      console.log("No agents available. API call stopped.");
    }
  }, 120000);
}

async function chatCloseByUser() {
  if (agentJoined === true) {
    const chatId = localStorage.getItem("chatId");
    const response = await fetch("/close-live-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatId: chatId }),
    });

    const dataChatClose = await response.json();
    console.log("Data Chat Close --: ", dataChatClose);
    if (dataChatClose.status === "success") {
      showEndChatAlertAgent();
    }
  } else {
    console.log("Chat bot doesn't have rating...");
    showEndChatAlertBot()
  }
}

function appendPlainTextContent(messageDiv, content) {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours
    .toString()
    .padStart(2, "0")}:${minutes} ${ampm}`;

  messageDiv.innerHTML = `<div class="messageWrapper">
        <span class="botname-message">${formattedTime}</span>
        <div class="contentWrapperProduct">
          <p class="mb-0">${content}</p>
        </div>
      </div>`;
}

function appendRatingForm(messageDiv) {
  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedTime = `${hours
    .toString()
    .padStart(2, "0")}:${minutes} ${ampm}`;

  const ratingFormHTML = `
      <div class="star-rating-form d-flex flex-column px-2 py-3 mt-3" style="margin-bottom: 10px;">
        <label for="rating">Rate your experience:</label>
        <div class="rating-icons d-flex flex-row" style="border: none !important;">
          <i class="bi bi-star rating-icon"></i>
          <i class="bi bi-star rating-icon"></i>
          <i class="bi bi-star rating-icon"></i>
          <i class="bi bi-star rating-icon"></i>
          <i class="bi bi-star rating-icon"></i>
        </div>
        <input type="hidden" id="rating" name="rating" value="0">
        <textarea type="text" id="feedbackMessage" name="feedbackMessage" class="feedbackMessage mb-2"></textarea>
        <button id="submitRatingButton" class="btnRatingView" onclick="handleRatingSubmission()">Submit</button>
      </div>
    `;

  messageDiv.innerHTML = `<div class="messageWrapper">
    <span class="botname-message">${formattedTime}</span>
    <div class="ratingFormTest">
      <p class="mb-0">Please rate your chat experience:</p>
    </div>
    ${ratingFormHTML}
  </div>`;

  // messageDiv.innerHTML += ratingFormHTML;

  addRatingIconEventListeners(messageDiv);
}

function addRatingIconEventListeners(messageDiv) {
  const ratingIcons = messageDiv.querySelectorAll(".rating-icon");
  ratingIcons.forEach((icon, index) => {
    icon.addEventListener("click", handleRatingIconClick(messageDiv, index));
  });
}

function handleRatingIconClick(messageDiv, index) {
  return function () {
    const ratingInput = messageDiv.querySelector("#rating");
    ratingInput.value = index + 1;
    const ratingIcons = messageDiv.querySelectorAll(".rating-icon");
    ratingIcons.forEach((star, i) => {
      star.classList.toggle("bi-star-fill", i <= index);
    });
  };
}

function showAlert(message) {
  const responseDiv = document.getElementById("response");
  const alertDiv = document.createElement("div");
  alertDiv.classList.add(
    "alert",
    "alert-warning",
    "alert-dismissible",
    "fade",
    "show",
    "me-2"
  );
  alertDiv.setAttribute("role", "alert");
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  responseDiv.appendChild(alertDiv);
  alertDiv.scrollIntoView({ behavior: "smooth" });
}

function showAlertSuccess(message) {
  const responseDiv = document.getElementById("response");
  const alertDiv = document.createElement("div");
  alertDiv.classList.add(
    "alert",
    "alert-success",
    "alert-dismissible",
    "fade",
    "show",
    "me-2"
  );
  alertDiv.setAttribute("role", "alert");
  alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  responseDiv.appendChild(alertDiv);
  alertDiv.scrollIntoView({ behavior: "smooth" });
}

function appendLanguageMessage(content) {
  const responseDiv = document.getElementById("response");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("bot-message");

  // Create an image element for the message
  const image = document.createElement("img");
  image.classList.add("message-image");
  image.src = "/agent.png";

  const currentTime = new Date();
  let hours = currentTime.getHours();
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const seconds = currentTime.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const formattedTime = `${hours
    .toString()
    .padStart(2, "0")}:${minutes} ${ampm}`;

  // Use innerHTML to allow HTML formatting in the message
  messageDiv.innerHTML = `<div class="messageWrapper">
    <span class="botname-message">${formattedTime}</span>
    <div>
      <p class="mb-0">${content}</p>
    </div>
  </div>`;
  messageDiv.prepend(image);

  responseDiv.appendChild(messageDiv);
  // Scroll down to the latest message
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

async function leadFormSubmit() {
  // console.log('Form submitted');


  // console.log(dataFromForm);
  // const response = await fetch("/data-flow-form-data", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify(dataFromForm),
  // });

  // const data = await response.json();
  // console.log("test chat response flow : ", data.body);

  console.log('Form submitted');

  // Get the form element
  const form = document.getElementById('leadForm');

  // Initialize an array to hold the form data
  const dataFromForm = [];

  // Iterate over the form elements
  // form.querySelectorAll('input, textarea').forEach(element => {
  //     dataFromForm.push({
  //       label: element.name,
  //       value: element.value
  //     });
  // });
  form.querySelectorAll('input, textarea').forEach(element => {
    // Find the corresponding label for the current element
    const labelElement = form.querySelector(`label[for="${element.id}"]`);
    const labelText = labelElement ? labelElement.textContent : '';

    dataFromForm.push({
      label: labelText,
      value: element.value
    });
  });

  // Log the extracted form data
  console.log(dataFromForm);

  // Send the form data to the server
  const response = await fetch("/data-flow-form-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dataFromForm),
  });

  const data = await response.json();
  console.log("test chat response flow: ", data.body);
}

// Event listener for question form submission
document
  .getElementById("questionForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const selectedLanguageLocal = localStorage.getItem("selectedLanguage");

    const questionInput = document.getElementById("question");

    let question;
    let selectedLanguage;
    if (selectedLanguageLocal === "singlish") {
      question = questionInput.value;
      selectedLanguage = "sinhala";
    } else if (selectedLanguageLocal === "tanglish") {
      question = questionInput.value;
      selectedLanguage = "tamil";
    } else {
      question = questionInput.value;
      selectedLanguage = selectedLanguageLocal;
    }
    console.log("Question:", question);
    console.log("selected Language:", selectedLanguage);

    // Add the user's question to the chat history
    chatHistory.push({ role: "user", content: question });

    appendMessageToResponse("user", question);

    let chatId = localStorage.getItem("chatId");
    console.log("generated chat id : ", chatId);
    const requestBody = {
      chatId: chatId,
      messages: chatHistory,
      language: selectedLanguage || "english",
    };
    const requestBodyAgent = {
      chatId: chatId,
      user_message: question,
      language: selectedLanguage || "english",
    };

    console.log("requestBody : ", requestBody);

    if (chatWithAgent === false) {
      // Display the user's message immediately
      // Change button icon to three dots
      const submitButton = document.querySelector(".chat-submit-button");
      submitButton.innerHTML = '<i class="bi bi-three-dots loading"></i>';
      submitButton.disabled = true;

      // Disable input field
      questionInput.disabled = true;
      // Show typing animation
      showTypingAnimation();

      const currentTime = new Date();
      let hours = currentTime.getHours();
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      const seconds = currentTime.getSeconds().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedTime = `${hours
        .toString()
        .padStart(2, "0")}:${minutes} ${ampm}`;

      if (chatStatus === "bot") {
        try {
          const response = await fetch("/api/chat-response-flow", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          console.log("test chat response flow : ", data.body);

          // Update the chat history for future interactions
          chatHistory = data.chatHistory || [];
          console.log("chatId : ", data.chatId);

          if (!localStorage.getItem("chatId")) {
            localStorage.setItem("chatId", data.chatId);
          }

          if (data.productOrService !== null) {
            // intent
            console.log("intent data : ", data.productOrService);
            const items = data.productOrService;

            // const formArray = item.node_data
            // const allItems = data.productOrService;
            // console.log("formArray : ", formArray);
            console.log("allItems : ", items)

            // const generateHTMLForItem = (item, index) => {
            //   switch (item.type) {
            //     case "buttonGroup":
            //       const buttonsHTML = item.node_data
            //         .map((buttonItem) => {
            //           if (buttonItem.button.link) {
            //             return `
            //                                     <a href="${buttonItem.button.link}" target="__blank" class="linkItem mb-2">${buttonItem.button.text}</a>
            //                                 `;
            //           } else {
            //             return `<button id="${buttonItem.button.node_id}" class="buttonItem mb-2">${buttonItem.button.text}</button>`;
            //           }
            //         })
            //         .join("");

            //       return `
            //                             <div class="buttonGroup p-0" style="box-shadow: none !important">
            //                                 ${buttonsHTML}
            //                             </div>`;
            //     case "textinput":
            //       return `
            //                             <div class="carousel-item p-0 ${index === 0 ? "active" : ""
            //         }" style="box-shadow: none !important">
            //                                 <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
            //                                     <p class="px-2" style="min-width: 250px">${item.node_data.title
            //         }</p>
            //                                     <p class="px-2" style="min-width: 250px">${item.node_data.description
            //         }</p>
            //                                 </div>
            //                             </div>`;
            //     case "cardGroup":
            //       const buttonsMainCardHTML = item.node_data
            //         .map((buttonItem) => {
            //           if (buttonItem.button && buttonItem.button.link) {
            //             return `
            //                                             <a href="${buttonItem.button.link}" target="__blank" class="linkItem mb-2">${buttonItem.button.text}</a>
            //                                         `;
            //           } else if (buttonItem.button) {
            //             return `<button id="${buttonItem.button.node_id}" class="buttonItem mb-2">${buttonItem.button.text}</button>`;
            //           }
            //           return "";
            //         })
            //         .join("");
            //       return `
            //                                 <div class="carousel-item p-0 ${index === 0 ? "active" : ""
            //         }" style="box-shadow: none !important">
            //                                     <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
            //                                         <img src="../images/bg-1.jpg" alt="" class="cardImage">
            //                                         <div class="cardGroup px-2" style="box-shadow: none !important">
            //                                             <h4 class="px-2 mt-2">${item.node_data[0].card
            //           .title
            //         }</h4>
            //                                             <p class="px-2">${item.node_data[0].card
            //           .description
            //         }</p>
            //                                             <div class="buttonGroup p-0" style="box-shadow: none !important">
            //                                                 ${buttonsMainCardHTML}
            //                                             </div>
            //                                         </div>
            //                                     </div>
            //                                 </div>`;
            //     case "textOnly":
            //       if (item.node_data.text.includes("●")) {
            //         const bulletPoints = item.node_data.text
            //           .split("●")
            //           .filter((point) => point.trim() !== "");
            //         const bulletPointsHTML = bulletPoints
            //           .map(
            //             (point) =>
            //               `<li class="mb-2" style="min-width: 250px">${point.trim()}</li>`
            //           )
            //           .join("");
            //         return `
            //                                 <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
            //                                     <ul class="px-3 py-2">${bulletPointsHTML}</ul>
            //                                 </div>`;
            //       } else {
            //         return `
            //                                 <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
            //                                     <p class="px-2" style="min-width: 250px">${item.node_data.text}</p>
            //                                 </div>`;
            //       }
            //     case "cardStyleOne":
            //       return `
            //                         <div class="carousel-item p-0 ${index === 0 ? "active" : ""
            //         }" style="box-shadow: none !important">
            //                             <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
            //                                 <img src="../images/bg-1.jpg" alt="" class="cardImage">
            //                                 <div class="cardGroup px-2" style="box-shadow: none !important">
            //                                     <h4 class="px-2 mt-2">${item.node_data[0].card.title
            //         }</h4>
            //                                     <p class="px-2">${item.node_data[0].card.description
            //         }</p>
            //                                 </div>
            //                             </div>
            //                         </div>`;
            //     default:
            //       return "";
            //   }
            // };




            const generateHTMLForItem = (item, index) => {
              switch (item.type) {
                case "buttonGroup":
                  const buttonsHTML = item.node_data
                    .map((buttonItem) => {
                      if (buttonItem.button.link) {
                        return `
                                                <a href="${buttonItem.button.link}" target="__blank" class="linkItem mb-2">${buttonItem.button.text}</a>
                                            `;
                      } else {
                        return `<button id="${buttonItem.button.node_id}" class="buttonItem mb-2">${buttonItem.button.text}</button>`;
                      }
                    })
                    .join("");

                  return `
                                        <div class="buttonGroup p-0" style="box-shadow: none !important">
                                            ${buttonsHTML}
                                        </div>`;
                case "textinput":
                  return `
                                        <div class="carousel-item p-0 ${index === 0 ? "active" : ""
                    }" style="box-shadow: none !important">
                                            <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                <p class="px-2" style="min-width: 250px">${item.node_data.title
                    }</p>
                                                <p class="px-2" style="min-width: 250px">${item.node_data.description
                    }</p>
                                            </div>
                                        </div>`;
                case "cardGroup":
                  const buttonsMainCardHTML = item.node_data
                    .map((buttonItem) => {
                      if (buttonItem.button && buttonItem.button.link) {
                        return `
                                                        <a href="${buttonItem.button.link}" target="__blank" class="linkItem mb-2">${buttonItem.button.text}</a>
                                                    `;
                      } else if (buttonItem.button) {
                        return `<button id="${buttonItem.button.node_id}" class="buttonItem mb-2">${buttonItem.button.text}</button>`;
                      }
                      return "";
                    })
                    .join("");
                  return `
                                            <div class="carousel-item p-0 ${index === 0 ? "active" : ""
                    }" style="box-shadow: none !important">
                                                <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                    <img src="../images/bg-1.jpg" alt="" class="cardImage">
                                                    <div class="cardGroup px-2" style="box-shadow: none !important">
                                                        <h4 class="px-2 mt-2">${item.node_data[0].card
                      .title
                    }</h4>
                                                        <p class="px-2">${item.node_data[0].card
                      .description
                    }</p>
                                                        <div class="buttonGroup p-0" style="box-shadow: none !important">
                                                            ${buttonsMainCardHTML}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>`;
                case "textOnly":
                  if (item.node_data.text.includes("●")) {
                    const bulletPoints = item.node_data.text
                      .split("●")
                      .filter((point) => point.trim() !== "");
                    const bulletPointsHTML = bulletPoints
                      .map(
                        (point) =>
                          `<li class="mb-2" style="min-width: 250px">${point.trim()}</li>`
                      )
                      .join("");
                    return `
                                            <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                <ul class="px-3 py-2">${bulletPointsHTML}</ul>
                                            </div>`;
                  } else {
                    return `
                                            <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                <p class="px-2" style="min-width: 250px">${item.node_data.text}</p>
                                            </div>`;
                  }
                case "cardStyleOne":
                  return `
                                    <div class="carousel-item p-0 ${index === 0 ? "active" : ""
                    }" style="box-shadow: none !important">
                                        <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                            <img src=${item.node_data[0].card.image} alt="" class="cardImage">
                                            <div class="cardGroup px-2" style="box-shadow: none !important">
                                                <h4 class="px-2 mt-2">${item.node_data[0].card.title
                    }</h4>
                                                <p class="px-2">${item.node_data[0].card.description
                    }</p>
                                            </div>
                                        </div>
                                    </div>`;
                case "formGroup":
                 

                  // const matchingNodes = allItems.nodes.filter(node => node.node_id === parent_id);
                  

                  return `
                  <div class="carousel-item p-0 ${index === 0 ? "active" : ""}" style="box-shadow: none !important">
                      <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                          ${generateForm(item.node_data)}
                      </div>
                  </div>`;
                default:
                  return "";
              }
            };


            function generateForm(node_data) {

              let formHtml = '<div id="leadForm" class="leadForm">';

              node_data.forEach(item => {
                const field = item.field;
                // Replace spaces with underscores for the name attribute
                const nameWithoutSpaces = field.label.replace(/\s+/g, '_');
                formHtml += '<div style="margin-bottom: 15px;display: flex; flex-direction: column;">';

                if (field.label) {
                  formHtml += `<label for="${field.node_id}">${field.label}</label>`;
                }

                if (field.type === 'text') {
                  formHtml += `<input type="text" id="${field.node_id}" name="${nameWithoutSpaces}" placeholder="${field.placeholder}" />`;
                } else if (field.type === 'message') {
                  formHtml += `<textarea id="${field.node_id}" name="${nameWithoutSpaces}" placeholder="${field.placeholder}"></textarea>`;
                }

                formHtml += '</div>';
              });

              // Add submit button
              formHtml += '<div style="display: flex; flex-direction: column; justify-content: center; align-items: center"><button type="button" onclick="leadFormSubmit()">Submit</button></div>';
              formHtml += '</div>';



              return formHtml;
            }



            // async function leadFormSubmit() {

            //   const form = document.getElementById('leadForm');
            //   const formData = new FormData(form);
            //   const dataFromForm = Object.fromEntries(formData.entries());

            //   console.log(dataFromForm);
            //   const response = await fetch("/data-flow-form-data", {
            //     method: "POST",
            //     headers: {
            //       "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify(dataFromForm),
            //   });

            //   const data = await response.json();
            //   console.log("test chat response flow : ", data.body);
            // }

            async function sendNodeId(nodeId) {
              const response = await fetch(
                "https://dfcc.vercel.app/chat-bot-get-target-data",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ source: nodeId }),
                }
              );

              const data = await response.json();
              console.log("node data === ", data);

              const generateHTMLForData = (items) => {
                return items
                  .map((item, index) => {
                    switch (item.type) {
                      case "cardGroup":
                        const buttonsCardHTML = item.source_data
                          .slice(1)
                          .map((buttonItem) => {
                            if (buttonItem.button.link) {
                              return `
                                                        
                                                            <a href="${buttonItem.button.link}" target="__blank" class="linkItem mb-2">${buttonItem.button.text}</a>
                                                        `;
                            } else {
                              return `
                                                                <button id="${buttonItem.button.node_id}" class="buttonItem mb-2">${buttonItem.button.text}</button>
                                                            `;
                            }
                          })
                          .join("");

                        return `
                                                    <div class="carousel-item p-0 ${index === 0 ? "active" : ""
                          }" style="box-shadow: none !important">
                                                        <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                            <img src="../images/bg-1.jpg" alt="" class="cardImage">
                                                            <div class="cardGroup px-2" style="box-shadow: none !important">
                                                                <h4 class="px-2 mt-2">${item
                            .source_data[0]
                            .card.title
                          }</h4>
                                                                <p class="px-2">${item
                            .source_data[0]
                            .card
                            .description
                          }</p>
                                                                <div class="buttonGroup p-0" style="box-shadow: none !important">
                                                                ${buttonsCardHTML}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>`;
                      case "buttonGroup":
                        const buttonsGroupHTML = item.source_data
                          .slice(0)
                          .map((buttonItem) => {
                            if (buttonItem.button.link) {
                              return `
                                                            
                                                                <a href="${buttonItem.button.link}" target="__blank" class="linkItem mb-2">${buttonItem.button.text}</a>
                                                            `;
                            } else {
                              return `<button id="${buttonItem.button.node_id}" class="buttonItem mb-2">${buttonItem.button.text}</button>`;
                            }
                          })
                          .join("");

                        return `
                        <div class="buttonGroup p-0" style="box-shadow: none !important">
                            ${buttonsGroupHTML}
                        </div>`;
                      case "textOnly":
                        return `
                                                <div class="carousel-item p-0 ${index === 0 ? "active" : ""
                          }" style="box-shadow: none !important">
                                                    <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                        <p class="px-2 mb-0">${item.source_data.text
                          }</p>
                                                    </div>
                                                </div>`;
                      case "textinput":
                        return `
                                                    <div class="carousel-item p-0 ${index === 0 ? "active" : ""
                          }" style="box-shadow: none !important">
                                                    <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                        <p class="px-2 ">${item.source_data.title
                          }</p>
                                                        <p class="px-2 mb-0">${item.source_data
                            .description
                          }</p>
                                                    </div>
                                                </div>`;
                      case "cardStyleOne":
                        return `
                                                <div class="carousel-item p-0 ${index === 0 ? "active" : ""
                          }" style="box-shadow: none !important">
                                                    <div class="slideInnerConteiner p-0" style="box-shadow: none !important">
                                                        <img src="../images/bg-1.jpg" alt="" class="cardImage">
                                                        <div class="cardGroup px-2" style="box-shadow: none !important">
                                                            <h4 class="px-2 mt-2">${item.source_data[0]
                            .card.title
                          }</h4>
                                                            <p class="px-2">${item.source_data[0]
                            .card.description
                          }</p>
                                                        </div>
                                                    </div>
                                                </div>`;
                      default:
                        return "";
                    }
                  })
                  .join("");
              };

              const carouselDataHTML = generateHTMLForData(data.sourceData);

              if (data.sourceData.length > 1) {
                const uniqueCarouselId = `carousel-${Date.now()}`;
                appendMessageToResponse(
                  "product",
                  `
                                            <div id="${uniqueCarouselId}" class="carousel slide bsSlider p-0" data-bs-ride="carousel">
                                                <div class="carousel-inner p-0">
                                                ${carouselDataHTML}
                                                </div>
                                                <button class="carousel-control-prev" type="button" data-bs-target="#${uniqueCarouselId}" data-bs-slide="prev">
                                                    <i class="bi bi-caret-left-fill"></i>
                                                    <span class="visually-hidden">Previous</span>
                                                </button>
                                                <button class="carousel-control-next" type="button" data-bs-target="#${uniqueCarouselId}" data-bs-slide="next">
                                                    <i class="bi bi-caret-right-fill"></i>
                                                    <span class="visually-hidden">Next</span>
                                                </button>
                                            </div>
                                        `
                );
              } else if (data.sourceData.length === 1) {
                appendMessageToResponse(
                  "product",
                  `
                                                                    <div>
                                                                        ${carouselDataHTML}
                                                                    </div>
                                                                `
                );
              }
            }

            document.addEventListener("click", (event) => {
              const button = event.target.closest(".buttonItem");
              if (button) {
                const nodeId = button.id;
                sendNodeId(nodeId);
              }
            });
            const carouselItemsHTML = items
              .map((item, index) => generateHTMLForItem(item, index))
              .join("");

            if (items.length > 1) {
              // Append the generated HTML to the response as a carousel if there is more than one item
              appendMessageToResponse(
                "product",
                `
                                  <div id="carouselExampleControls" class="carousel slide bsSlider p-0" data-bs-ride="carousel">
                                      <div class="carousel-inner p-0">
                                      ${carouselItemsHTML}
                                      </div>
                                      <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="prev">
                                          <i class="bi bi-caret-left-fill text-danger"></i>
                                          <span class="visually-hidden">Previous</span>
                                      </button>
                                      <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleControls" data-bs-slide="next">
                                          <i class="bi bi-caret-right-fill text-danger"></i>
                                          <span class="visually-hidden">Next</span>
                                      </button>
                                  </div>
                              `
              );
            } else if (items.length === 1) {
              // Append the generated HTML to the response without the carousel if there is only one item
              appendMessageToResponse(
                "product",
                `
                                  <div>
                                      ${carouselItemsHTML}
                                  </div>
                              `
              );
            }
          } else {
            console.log("if not a product");
          }

          if (data.answer !== null) {
            appendMessageToResponse("bot", data.answer, data);
          }

          // Hide typing animation
          hideTypingAnimation();
          // Clear the question input
          questionInput.value = "";
          // box2Input.value = "";
          submitButton.innerHTML = '<i class="bi bi-send"></i>';
          submitButton.disabled = false;
        } catch (error) {
          console.error("Error submitting question:", error);
          // Handle specific error message
          handleErrorMessage(error);
        } finally {
          // Enable input field
          questionInput.disabled = false;
        }
      }

    } else {
      const responseLiveAgent = await fetch("/live-chat-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBodyAgent),
      });

      const liveAgentData = await responseLiveAgent.json();
      chatHistory = liveAgentData.chatHistory || []; // Update chat history

      // Append the response to the response div

      // checkForAgent();
      // Hide typing animation
      // hideTypingAnimation();

      // Clear the question input
      questionInput.value = "";

      // Change button icon back to send icon
      // submitButton.innerHTML = '<i class="bi bi-send"></i>';

      // Enable the submit button
      // submitButton.disabled = false;
    }
  });

// Event listener for language change to english
document
  .getElementById("changeToEnglishButton")
  .addEventListener("click", function () {
    document.getElementById("box1").style.display = "none";
    document.getElementById("box2").style.display = "none";
    localStorage.setItem("selectedLanguage", "english");
    appendLanguageMessage("Please ask your question in english.");
  });

// Event listener for language change to sinhala
document
  .getElementById("changeToSinhalaButton")
  .addEventListener("click", function () {
    document.getElementById("box1").style.display = "none";
    document.getElementById("box2").style.display = "none";
    localStorage.setItem("selectedLanguage", "sinhala");
    appendLanguageMessage("කරුණාකර ඔබේ ප්‍රශ්නය සිංහලෙන් අසන්න.");
  });

// Event listener for language change to tamil
document
  .getElementById("changeToTamilButton")
  .addEventListener("click", function () {
    document.getElementById("box1").style.display = "none";
    document.getElementById("box2").style.display = "none";
    localStorage.setItem("selectedLanguage", "tamil");
    appendLanguageMessage("உங்கள் கேள்வியை தமிழில் கேளுங்கள்.");
  });

document
  .getElementById("changeToSinglish")
  .addEventListener("click", function () {
    document.getElementById("box1").style.display = "block";
    document.getElementById("box2").style.display = "none";
    document.getElementById("question").style.display = "block";
    localStorage.setItem("selectedLanguage", "singlish");
    appendLanguageMessage("කරුණාකර ඔබේ ප්‍රශ්නය සිංහලෙන් අසන්න.");
  });

document
  .getElementById("changeToTanglish")
  .addEventListener("click", function () {
    document.getElementById("box1").style.display = "none";
    document.getElementById("box2").style.display = "block";
    document.getElementById("question").style.display = "block";
    localStorage.setItem("selectedLanguage", "tanglish");
    appendLanguageMessage("உங்கள் கேள்வியை தமிழில் கேளுங்கள்.");
  });

// Function to handle rating submission
async function handleRatingSubmission() {
  const ratingInput = document.getElementById("rating");
  const rating = ratingInput.value;
  const feedbackMessageInput = document.getElementById("feedbackMessage");
  const feedbackMessage = feedbackMessageInput.value;
  const chatId = localStorage.getItem("chatId");

  try {
    const response = await fetch("/save-rating", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ratingValue: rating,
        feedbackMessage: feedbackMessage,
        chatId: chatId,
      }),
    });

    if (response.ok) {
      // Show thank you message for feedback
      const responseDiv = document.getElementById("response");
      const thankYouDiv = document.createElement("div");
      thankYouDiv.classList.add(
        "alert",
        "alert-success",
        "alert-dismissible",
        "fade",
        "show"
      );
      thankYouDiv.setAttribute("role", "alert");
      thankYouDiv.textContent = "Thank you for your feedback!";
      responseDiv.appendChild(thankYouDiv);
      thankYouDiv.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    console.error("Error submitting rating:", error);
    // Handle error
  }
}

// Add event listeners for the rating icons
function addRatingIconEventListeners(messageDiv) {
  const ratingIcons = messageDiv.querySelectorAll(".rating-icon");
  ratingIcons.forEach((icon, index) => {
    icon.addEventListener("click", () => {
      // Set the rating value based on the index of the clicked star icon
      const ratingInput = document.getElementById("rating");
      ratingInput.value = index + 1;

      // Highlight the selected star and unhighlight the rest
      ratingIcons.forEach((star, i) => {
        if (i <= index) {
          star.classList.add("bi-star-fill");
          star.classList.remove("bi-star");
        } else {
          star.classList.remove("bi-star-fill");
          star.classList.add("bi-star");
        }
      });
    });
  });
}

// Call the function with messageDiv when it's available
addRatingIconEventListeners(messageDiv);
