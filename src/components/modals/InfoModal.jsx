import React from 'react';
import { AlertCircle, Coffee } from 'lucide-react';
import { Modal } from './Modal';

export const InfoModal = ({ onClose, darkMode = false }) => {
  return (
    <Modal title="About Caffeine" onClose={onClose} darkMode={darkMode}>
      <div className="space-y-4">
        <section>
          <h3 className="text-lg font-medium flex items-center mb-2">
            <Coffee size={20} className="mr-2" aria-hidden="true" />
            What is Caffeine?
          </h3>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Caffeine is a natural stimulant most commonly found in tea, coffee, and cacao plants. It works by stimulating the brain and central nervous system, helping you stay alert and preventing the onset of tiredness.
          </p>
        </section>
        
        <section>
          <h3 className="text-lg font-medium flex items-center mb-2">
            <Coffee size={20} className="mr-2" aria-hidden="true" />
            How Caffeine Affects Your Body
          </h3>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
            Once consumed, caffeine is quickly absorbed into the bloodstream. From there, it travels to the liver and is broken down into compounds that can affect the function of various organs.
          </p>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            The main effect is on the brain, where it blocks the effects of adenosine, a neurotransmitter that relaxes the brain and makes you feel tired.
          </p>
        </section>
        
        <section>
          <h3 className="text-lg font-medium flex items-center mb-2">
            <Coffee size={20} className="mr-2" aria-hidden="true" />
            Metabolism and Half-Life
          </h3>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
            The half-life of caffeine (time taken for the body to eliminate half of the caffeine) varies greatly among individuals:
          </p>
          <ul className={`list-disc pl-5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <li>Fast metabolizers: ~4 hours</li>
            <li>Average metabolizers: ~5.5 hours</li>
            <li>Slow metabolizers: ~7.5 hours</li>
          </ul>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} mt-2`}>
            Factors that can affect metabolism include genetics, pregnancy, smoking status, liver function, and medications like oral contraceptives.
          </p>
        </section>
        
        <section>
          <h3 className="text-lg font-medium flex items-center mb-2">
            <AlertCircle size={20} className="mr-2" aria-hidden="true" />
            Recommended Limits
          </h3>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
            Up to 400mg of caffeine a day appears to be safe for most healthy adults. That's roughly the amount of caffeine in:
          </p>
          <ul className={`list-disc pl-5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <li>4 cups (8 oz each) of brewed coffee</li>
            <li>10 cans of cola</li>
            <li>2 energy drinks</li>
          </ul>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'} mt-2`}>
            For pregnant women, the recommended limit is lower at 200mg per day.
          </p>
        </section>
        
        <section>
          <h3 className="text-lg font-medium flex items-center mb-2">
            <AlertCircle size={20} className="mr-2" aria-hidden="true" />
            Sleep and Caffeine
          </h3>
          <p className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            For quality sleep, it's recommended to stop consuming caffeine 6-8 hours before bedtime. This app will help you track when your caffeine levels will be low enough for restful sleep.
          </p>
        </section>
        
        <div className={`mt-6 p-4 rounded-2xl text-sm glass-surface glass-highlight ${
          darkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          <p>
            This app provides general guidelines and calculations based on scientific research but is not a medical tool. Individual responses to caffeine can vary significantly.
          </p>
        </div>
      </div>
    </Modal>
  );
}; 
