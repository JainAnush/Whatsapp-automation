const templates = [
  (name, interest) =>
    `Hi ${name}, excited to help you start your ${interest} journey with BorderPlus!`,
  (name, interest) =>
    `Hello ${name}, are you ready to explore opportunities in ${interest}? BorderPlus is here for you.`,
  (name, interest) =>
    `Hey ${name}! BorderPlus can guide you to success in ${interest}. Let’s get started.`,
];

function getRandomTemplate(name, interest) {
  const index = Math.floor(Math.random() * templates.length);
  return templates[index](name, interest);
}

module.exports = { getRandomTemplate };
