// WeatherApp.jsx
import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import debounce from 'lodash.debounce';
import { useForm } from 'react-hook-form';
import search_icon from '../assets/search.png';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import humidity_icon from '../assets/humidity.png';
import snow_icon from '../assets/snow.png';
import wind_icon from '../assets/wind.png';
import rain_icon from '../assets/rain.png';
import './Weather.css'; // Ensure you have the CSS ready

// Redux slice for managing weather state
const weatherSlice = createSlice({
  name: 'weather',
  initialState: { weatherData: null, loading: false, error: null },
  reducers: {
    setWeatherData: (state, action) => {
      state.weatherData = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

const { setWeatherData, setLoading, setError } = weatherSlice.actions;

// Store setup
const store = configureStore({
  reducer: {
    weather: weatherSlice.reducer,
  },
});

// Context for Dark Mode
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

// Theme provider for Dark Mode
const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Reusable WeatherDetail component
const WeatherDetail = ({ icon, value, label }) => (
  <div className='col'>
    <img src={icon} alt={label} />
    <div>
      <p>{value}</p>
      <span>{label}</span>
    </div>
  </div>
);

// Weather Card component
const WeatherCard = ({ weatherData }) => (
  <>
    <img src={weatherData.icon} alt="weather-icon" className='weather-icon' />
    <p className='temperature'>{weatherData.temperature}°c</p>
    <p className='location'>{weatherData.location}</p>
    <div className='weather-data'>
      <WeatherDetail icon={humidity_icon} value={`${weatherData.humidity}%`} label="Humidity" />
      <WeatherDetail icon={wind_icon} value={`${weatherData.windSpeed} km/h`} label="Wind Speed" />
    </div>
  </>
);

// SearchForm component with validation
const SearchForm = ({ onSearch }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const inputRef = useRef();

  const onSubmit = (data) => {
    onSearch(data.city);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='search-bar'>
      <input
        {...register("city", { required: "City name is required" })}
        ref={inputRef}
        type="text"
        placeholder='Search'
      />
      {errors.city && <span className='error-message'>{errors.city.message}</span>}
      <img src={search_icon} alt="search" onClick={() => onSearch(inputRef.current.value)} />
    </form>
  );
};

// Main Weather component
const Weather = React.memo(() => {
  const dispatch = useDispatch();
  const { weatherData, loading, error } = useSelector((state) => state.weather);
  const { darkMode, toggleTheme } = useTheme();
  const [allIcons] = useState({
    "01d": clear_icon,
    "01n": clear_icon,
    "02d": cloud_icon,
    "02n": cloud_icon,
    "03d": cloud_icon,
    "03n": cloud_icon,
    "04d": drizzle_icon,
    "04n": drizzle_icon,
    "09d": rain_icon,
    "09n": rain_icon,
    "10d": rain_icon,
    "10n": rain_icon,
    "13d": snow_icon,
    "13n": snow_icon,
  });

  const search = async (city) => {
    if (city === "") {
      alert("Enter City Name");
      return;
    }

    dispatch(setLoading());
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${import.meta.env.VITE_APP_ID}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        dispatch(setError(data.message));
        return;
      }

      const icon = allIcons[data.weather[0].icon] || clear_icon;
      dispatch(setWeatherData({
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        temperature: Math.floor(data.main.temp),
        location: data.name,
        icon: icon,
      }));
    } catch (error) {
      dispatch(setError("Error fetching weather data"));
    }
  };

  const debouncedSearch = debounce((value) => search(value), 500);

  useEffect(() => {
    search("Lahore"); // Initial city load
  }, []);

  return (
    <div className={`weather ${darkMode ? 'dark' : 'light'}`}>
      <button onClick={toggleTheme} className="toggle-btn">
        Toggle {darkMode ? "Light" : "Dark"} Mode
      </button>

      <SearchForm onSearch={debouncedSearch} />

      {loading && <p>Loading...</p>}
      {error && <p className='error-message'>{error}</p>}

      {weatherData && <WeatherCard weatherData={weatherData} />}
    </div>
  );
});

// Root App Component
const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Weather />
      </ThemeProvider>
    </Provider>
  );
};

export default App;


