// Image Analysis Service
export async function analyzeImage(imageUrl) {
    try {
        const completion = await websim.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an AI image analysis expert. Provide a comprehensive and detailed description of the image.
                    Include:
                    - Main subjects
                    - Colors and composition
                    - Possible context or background story
                    - Artistic or technical details
                    - Any notable or unique elements`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this image in detail:"
                        },
                        {
                            type: "image_url",
                            image_url: { url: imageUrl }
                        }
                    ]
                }
            ]
        });

        return completion.content;
    } catch (error) {
        console.error("Image analysis error:", error);
        return "I apologize, but I encountered an issue analyzing the image. Could you try uploading it again?";
    }
}

export async function uploadAndAnalyzeImage(file) {
    try {
        // Upload image to get URL
        const imageUrl = await websim.upload(file);
        
        // Analyze the uploaded image
        const analysisResult = await analyzeImage(imageUrl);
        
        return {
            url: imageUrl,
            analysis: analysisResult
        };
    } catch (error) {
        console.error("Image upload and analysis error:", error);
        throw error;
    }
}