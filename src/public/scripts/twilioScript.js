document.getElementById('questionForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  
  const phoneNumber = document.getElementById('phoneNumber').value;

  try {
    const response = await fetch("/twilio-call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber: phoneNumber }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const dataLiveAgent = await response.json();
    console.log("response Data agent --: ", dataLiveAgent);
  } catch (error) {
    console.error('Error:', error);
  }
});