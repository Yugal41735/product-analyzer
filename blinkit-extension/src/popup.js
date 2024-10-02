document.getElementById('extract-button').addEventListener('click', () => {
    // Collect user preferences
    const diabetes = document.getElementById('diabetes').checked;
    const allergies = document.getElementById('allergies').value.trim();
    const dietPlan = document.getElementById('diet-plan').value;

    // Show a loading message while waiting for the backend response
    const loadingElement = document.getElementById('loading-message');
    loadingElement.style.display = 'block';

    // Query the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "extractProductInfo" }, async (response) => {
            if (response) {
                let ingredientsOrNutrition = response.productIngredients || response.productNutrition;
                let productName = response.productName;

                if (ingredientsOrNutrition) {
                    try {
                        // Prepare the data to be sent to the backend, including user preferences
                        const requestData = {
                            productName,
                            ingredientsOrNutrition,
                            userPreferences: {
                                diabetes,
                                allergies,
                                dietPlan
                            }
                        };

                        // Send the data to the backend for analysis
                        const analysisResponse = await fetch('http://localhost:3000/analyze', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(requestData)
                        });

                        if (!analysisResponse.ok) {
                            throw new Error(`Server responded with status ${analysisResponse.status}`);
                        }

                        const analysisData = await analysisResponse.json();

                        // Hide the loading message after receiving the response
                        loadingElement.style.display = 'none';

                        // Print the response to the console for debugging purposes
                        console.log("Analysis Response from Backend:", analysisData);

                        // Populate the modal with analysis results
                        let message = `<strong>Product:</strong> ${response.productName || 'N/A'}`;
                        if (response.productIngredients) {
                            message += `<br><strong>Ingredients:</strong> ${response.productIngredients}`;
                        }
                        if (response.productNutrition) {
                            message += `<br><strong>Nutrition Information:</strong> ${response.productNutrition}`;
                        }

                        // Add the raw analysis from Gemini model without cleaning or formatting
                        if (analysisData.analysis) {
                            message += `<br><br><strong>Gemini Analysis (Raw Output):</strong><br>${analysisData.analysis}`;
                        }

                        // Add user preferences to the output
                        message += `<br><br><strong>User Preferences:</strong><br>`;
                        message += diabetes ? `- Has diabetes<br>` : '- No diabetes<br>';
                        if (allergies) {
                            message += `- Allergies: ${allergies}<br>`;
                        }
                        if (dietPlan && dietPlan !== "none") {
                            message += `- Follows a ${dietPlan} diet<br>`;
                        }

                        document.getElementById('analysis-results').innerHTML = message;

                        // Show the modal
                        const modal = document.getElementById('analysis-modal');
                        modal.style.display = 'block';

                    } catch (error) {
                        // Hide the loading message if an error occurs
                        loadingElement.style.display = 'none';
                        
                        // Log error details to the console
                        console.error("Error processing analysis:", error);
                        alert("Error processing analysis. Check console for details.");
                    }
                } else {
                    // Hide the loading message if no product information was found
                    loadingElement.style.display = 'none';
                    alert("No ingredients or nutrition information found to analyze.");
                }
            } else {
                // Hide the loading message if product information couldn't be extracted
                loadingElement.style.display = 'none';
                alert("Product information could not be extracted. Please try again.");
            }
        });
    });
});

// Modal close button functionality
document.querySelector('.close-button').addEventListener('click', () => {
    const modal = document.getElementById('analysis-modal');
    modal.style.display = 'none';
});

// Show a loading message while waiting for the backend response
function showLoading() {
    const loadingElement = document.createElement('div');
    loadingElement.id = 'loading-message';
    loadingElement.innerText = 'Processing... Please wait.';
    loadingElement.style.display = 'none';
    document.body.appendChild(loadingElement);
}

// Add the loading message element when the page loads
showLoading();
