const test = async () => {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/+esm');
    console.log(env);
}
test();
