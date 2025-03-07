# CafTrack: Caffeine Intake Tracker

A comprehensive web application that helps users track, visualize, and manage their caffeine intake. Built with a mobile-first approach, this app offers real-time caffeine level monitoring, metabolism forecasting, and sleep readiness indicators.

## Features

- **Real-time caffeine level monitoring**: Track how much caffeine is in your system at any given moment
- **Metabolism forecasting**: Visualize how caffeine levels will decrease over time based on your personal metabolism profile
- **Sleep readiness indicators**: Know when your caffeine levels will be low enough for quality sleep
- **Personalized settings**: Customize for individual factors like metabolism rate, caffeine tolerance, and special conditions
- **Comprehensive drink database**: Pre-configured options for coffee, tea, energy drinks and sodas
- **Custom drink tracking**: Add your own caffeine sources with custom amounts
- **Dark/light mode**: Toggle between visual themes for comfort
- **Mobile-optimized interface**: Swipe gestures, bottom navigation, and responsive design

## Technologies Used

- **React.js**: Front-end framework
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Recharts**: Charting library for data visualization 
- **Lucide React**: Icon library
- **localStorage API**: For persistent data storage

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/caffeine-calculator.git
cd caffeine-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### Adding Caffeine Intake

1. Click the "+" button in the bottom right corner
2. Select a drink from the pre-configured options or add a custom drink
3. Your caffeine intake will be added to your history and reflected in your current level

### Viewing Caffeine Levels

- The home screen shows your current caffeine level and sleep readiness
- Swipe left to view your intake history
- Swipe left again to view a chart of your projected caffeine levels over time

### Customizing Settings

1. Click the settings icon in the top right corner
2. Adjust your metabolism rate, caffeine limit, sleep time, and other preferences
3. Toggle dark mode on/off as desired

## Deployment

This app can be easily deployed to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings

## License

MIT

## Acknowledgements

- Caffeine data sourced from scientific research and public databases
- Metabolism calculations based on peer-reviewed studies on caffeine half-life
