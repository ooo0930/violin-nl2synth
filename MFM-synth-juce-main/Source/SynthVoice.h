/**
 * @file SynthVoice.h
 * 
 * @brief 
 * 
 * @author
 */


#pragma once

#include <JuceHeader.h>
#include "SynthSound.h"
#include "cnpy/cnpy.h"
#include <memory>
#include <vector>
#include "MFMParam.h"
#include "MFMControl.h"
#include <vector>



using namespace juce;

constexpr float twoPi = 2 * float_Pi;

namespace {
    float sampleFromArray(float* array, float index, int length=2147483647) {
        int i = (int)index;
		if (i >= length - 1) {
			return array[length - 1];
		}
        float a = array[i];
        float b = array[i + 1];
        float interp = index - i;
        return a * (1 - interp) + b * interp;
    }

    class LoopSamplerOld {
	public:
		LoopSamplerOld(float* array, float loopStart, float loopEnd, float overlap = 0) :
            array(array), 
            loopStart(loopStart), 
            loopEnd(loopEnd),
			overlap(overlap)
        {
			loopLength = loopEnd - loopStart;
		}
		float sample(float index, int indexOffset) {
			if (index < loopEnd) {
				return sampleFromArray(array, indexOffset + index);
			}
			index = fmod(index - loopStart, loopLength);
            if (index < overlap) {
				const float lerp = index / overlap;
				return sampleFromArray(array, indexOffset + loopStart + index) * lerp 
                    + sampleFromArray(array, indexOffset + loopEnd + index) * (1 - lerp);
            }
			return sampleFromArray(array, indexOffset + loopStart + index);
		}

	private:
		float* array;
		float loopStart, loopEnd, loopLength, overlap;
	};

	class LoopSampler {
	public:
		LoopSampler(float* array, float loopStartRaw, float loopEndRaw, float sr, float overlapRaw = 0)
		{
			this->array = array;
			this->loopStart = loopStartRaw * sr;
			this->loopEnd = loopEndRaw * sr;
			this->overlap = overlapRaw * sr;
			this->overlapRaw = overlapRaw;
			this->loopEndRaw = loopEndRaw;
			this->loopStartRaw = loopStartRaw;
			this->loopLengthRaw = loopEndRaw - loopStartRaw;
			loopLength = loopEnd - loopStart;
			this->loopSamples = std::vector<float>(loopLength);
			this->isLoopSamplesCached = std::vector<bool>(loopLength,false);

			this->recip_sr = 1.0f / sr;

			this->sampleLimit = loopEndRaw + overlapRaw;
		}
		float sample(int i) {
			if (i < loopStart + overlap) {
				float target_pos = (float(i)) * this->recip_sr;
				float result = sampleFromArray(array, target_pos,sampleLimit);
				return result;
			}
			else {

				int i_loop = (i - loopStart) % loopLength; // betwen 0 and loopLength-1
				// use cache if cache is filled
				if (isLoopSamplesCached[i_loop]) {
					float result = loopSamples[i_loop];
					return result;
				}

				// cache is not filled. calculate manually

				float targetPos = float(i_loop) * recip_sr; // between 0 and loopLengthRaw-1
				// not in overlap area
				//if (targetPos > overlapRaw) {
				if (i_loop >= overlap) {
					float result = sampleFromArray(array, targetPos + loopStartRaw, sampleLimit);
					loopSamples[i_loop] = result;
					isLoopSamplesCached[i_loop] = true;
					return result;
				}

				// in overlap area
				const float lerp = targetPos / overlapRaw;
				float result = sampleFromArray(array, targetPos + loopStartRaw, sampleLimit) * lerp
					+ sampleFromArray(array, targetPos + loopEndRaw, sampleLimit) * (1 - lerp);


				loopSamples[i_loop] = result;
				isLoopSamplesCached[i_loop] = true;
				return result;
			}
		}

	private:
		float* array;
		std::vector<float> loopSamples;
		std::vector<bool> isLoopSamplesCached;
		int loopStart, loopEnd, loopLength, overlap;
		float loopEndRaw, overlapRaw, loopStartRaw, loopLengthRaw;
		float recip_sr;
		int sampleLimit;
	};

	class MultiChannelLoopSampler {
	public:
		MultiChannelLoopSampler(float* array, int channelSize, int numChannels, float sr, float loopStart, float loopEnd, float overlap = 0)
		{
			this->numChannels = numChannels;
			for (int i = 0; i < numChannels; i++) {
				samplers.push_back(LoopSampler(array + (channelSize*i), loopStart, loopEnd, sr, overlap));
			}
		}
		float sample(int channel, int index) {
			return samplers[channel].sample(index);
		}

	private:
		std::vector<LoopSampler> samplers;
		int numChannels;
	};

	class TailSampler {
	public:
		TailSampler(float* array, int length, float rightMargin=0) :
			array(array),
			length(length),
			rightMargin(rightMargin)
		{
			jassert(rightMargin < length);
		}
		float sample(float index, int indexOffset) {
			if (length == 1) {
				return array[0];
			}
			index = std::fmin(length-1-rightMargin, index);
			return sampleFromArray(array, indexOffset + index);
		}

	private:
		float* array;
		int length;
		float rightMargin;
	};
}

enum class VoiceState {
	SUSTAIN,
	RELEASE,
	IDLE
};

class SynthVoice : public juce::SynthesiserVoice
{
public:

	SynthVoice() {}

    void prepareToPlay(
        std::map<int, std::shared_ptr<MFMParam>>* mfmParams,
        std::map<juce::String, std::shared_ptr<MFMControl>>* mfmControls,
		std::map<int, juce::String>* channelToImage,
        int currentNoteChannel[128]
    ){
        this->mfmParams = mfmParams;
		this->mfmControls = mfmControls;
		this->currentNoteChannel = currentNoteChannel;
		this->channelToImage = channelToImage;

		generateColoredNoise(noise, 80000, 2000);
    }

    bool canPlaySound (juce::SynthesiserSound* sound) override
    {
        return dynamic_cast <SynthSound*>(sound) != nullptr;
    }



	void setValueTree(AudioProcessorValueTreeState& valueTree)
	{
		this->valueTree = &valueTree;
	}

    
    void startNote (int midiNoteNumber, float velocity, SynthesiserSound* sound, int currentPitchWheelPosition) override
    {


		// if mfmParams do not have midiNoteNumber, play nothing
        if (mfmParams->find(midiNoteNumber) == mfmParams->end()) {
			param.reset();
			clearCurrentNote();
            state = VoiceState::IDLE;
			return;
        }

        // select param
		param = (*mfmParams)[midiNoteNumber];

		frameIdx = 0;

		// initialize loop samplers
		//const float loopStart = getParam("loopStart") * param->param_sr;
		//const float loopEnd = std::fmin(getParam("loopEnd") * param->param_sr, param->num_samples

		// for now loop start and end are hardcoded
		const float loopStart = 0.4 * param->param_sr;
		const float loopEnd = std::fmin(1.25 * param->param_sr, param->num_samples);
		const float loopOverlap = 0.5 * param->param_sr;

		const float audioParamSampleRatio =  ((float)getSampleRate())/ ((float) param->param_sr);
		magGlobal = std::make_unique<MultiChannelLoopSampler>(param->magGlobal.get(), param->num_samples, param->num_partials, audioParamSampleRatio, loopStart, loopEnd, loopOverlap);
		alphaGlobal = std::make_unique<MultiChannelLoopSampler>(param->alphaGlobal.get(), param->num_samples, param->num_partials, audioParamSampleRatio, loopStart, loopEnd, loopOverlap);
		noiseSampler1 = std::make_unique<LoopSampler>(noise, 5000, 60000, (2000/ param->coloredCutoff1), 10);
		noiseSampler2 = std::make_unique<LoopSampler>(noise, 5000, 60000, (2000 / param->coloredCutoff2), 10);

		
		alphaLocalEnv1 = std::make_unique<MultiChannelLoopSampler>(param->alphaLocalEnv1.get(), param->num_samples, param->num_partials, audioParamSampleRatio, loopStart, loopEnd, loopOverlap);
		alphaLocalEnv2 = std::make_unique<MultiChannelLoopSampler>(param->alphaLocalEnv2.get(), param->num_samples, param->num_partials, audioParamSampleRatio, loopStart, loopEnd, loopOverlap);

		// select control
		/*juce::String controlToUse = (*channelToImage)[currentNoteChannel[midiNoteNumber]];
		if (controlToUse == nullptr) {
			state = VoiceState::IDLE;
			return;
		}*/

		//auto currentChannel = currentNoteChannel[midiNoteNumber];
		auto currentChannel = 1; // images are disabled for now
		if (channelToImage->find(currentChannel) == channelToImage->end()) {
			state = VoiceState::IDLE;
			return;
		}
		auto controlName = (*channelToImage)[currentChannel];
		if (mfmControls->find(controlName) == mfmControls->end()) {
			state = VoiceState::IDLE;
			return;
		}
		auto control = (*mfmControls)[controlName];

		int rightMargin = std::min(control->length-1, 5);
		intensityS = std::make_unique<TailSampler>(control->intensity.get(), control->length, rightMargin);
		pitchS = std::make_unique<TailSampler>(control->pitch.get(), control->length, rightMargin);
		densityS = std::make_unique<TailSampler>(control->density.get(), control->length, rightMargin);
		hueS = std::make_unique<TailSampler>(control->hue.get(), control->length, rightMargin);
		saturationS = std::make_unique<TailSampler>(control->saturation.get(), control->length, rightMargin);
		valueS = std::make_unique<TailSampler>(control->value.get(), control->length, rightMargin);


		state = VoiceState::SUSTAIN;
        timeAfterNoteStop = 0;
        time = 0;
		for (int i = 0; i < param->num_partials; i++) {
            ft[i] = 0;
		}
		this->pitch = midiNoteNumber;
        this->velocity = velocity;
        baseFrequency = MidiMessage::getMidiNoteInHertz(midiNoteNumber);
        //frequency = param->base_freq;

		// fill random values from 0-40000 in noisesampleShifts
		Random r;
		for (int i = 0; i < noiseSampleShifts.size(); i++) {
			noiseSampleShifts[i] = r.nextInt(40000);
		}
    }
    
    void stopNote (float velocity, bool allowTailOff) override
    {
        if (allowTailOff) {
			state = VoiceState::RELEASE;
        }
        else {
            clearCurrentNote();
        }
    }
    
    void pitchWheelMoved (int value) override
    {
		setParam(*valueTree, "pitchVariance", value / 16384.0f);
    }
    
    void controllerMoved (int controllerNumber, int newControllerValue) override
    {
        
    }
    
    void renderNextBlock (AudioBuffer <float> &outputBuffer, int startSample, int numSamples) override
	{
		if(param == nullptr) {
	        return;
        }
		if (state == VoiceState::IDLE) {
			return;
		}
		if (state == VoiceState::RELEASE && timeAfterNoteStop > 0.3) {
			clearCurrentNote();
			state = VoiceState::IDLE;
			return;
		}

		if (frameIdx > INT_MAX - 5000) {
			// reset frameIdx to avoid overflow
			frameIdx = 0;
		}

		// control

		float timbreGain = 2;

		// for now, just use the parameter values directly
		//float cIdx = time * 50.0f; // 50 Hz control rate
		//float intensity = intensityS->sample(cIdx, 0);
		//float roughness = densityS->sample(cIdx, 0);
		//float pitchVar = pitchS->sample(cIdx, 0);
		//float bowPos = hueS->sample(cIdx, 0);
		//float resonance = saturationS->sample(cIdx, 0);
		//float sharpness = valueS->sample(cIdx, 0);

		float intensity = getParam("intensity", 0.02);
		float roughness = getParam("roughness", 0.02);
		float pitchVar = getParam("pitchVariance", 0.02);
		float bowPos = getParam("bowPosition", 0.02);
		float resonance = getParam("resonance", 0.02);
		float sharpness = getParam("sharpness", 0.02);
		float vibrato = getParam("vibrato", 0.02);
		// precompute some constants outside the sample loop
        float recip_two_pi = 1.0f / (2 * float_Pi);
        const float dt = 1.0 / getSampleRate();
        const float attackFactor = 1.0f / param->envelope[(int)(((float)param->attackLen) / param->sampleRate * param->param_sr) - 1];

        const float gain = getParam("gain");
        
        float pIdx = time * param->param_sr;
		

		float vibratoTime = time;
		if (time < 0.5) {
			vibratoTime = 0.5 + (exp(4 * (time - 0.5)) - 1) / 4;
		}
		vibratoTime -= 0.28; // so it start from 0
		float vibratoValue = vibrato * cos(twoPi * vibratoTime * 5);

		// translate controls to control vector
		bowPos = std::fmin(bowPos, 135);
		bowPos = std::max(bowPos, 0.0f);
		bowPos = 1 / (bowPos / 135 * 5 + 2);


		const float frequency = baseFrequency * exp2f((pitchVar + vibratoValue*0.1) / 12); // pitch in semitones

		float magControl[100] = { 1 };
		float alphaControl[100] = { 1 };

		for (int i = 0; i < param->num_partials; i++) {
			int n = i + 1;
			float overtoneFreq = frequency * n;
			// apply intensity
			magControl[i] = intensity;
			// apply bowPos
			magControl[i] *= (1 - (1 - std::fmax( 0,std::fmin(1,std::abs(n - (1.0f / bowPos))))) * (timbreGain - 1));

			// apply saturation
			if (overtoneFreq <= 1000) {
				magControl[i] *= pow(10, (-3 + resonance * 6)*6 / 20);
			}

			// apply value
			if (overtoneFreq >= 5000) {
				magControl[i] *= pow(10, (-3 + sharpness * 6)*6 / 20);
			}

			alphaControl[i] = roughness * 0.15; 
			if (time < 0.5) {
				alphaControl[i] *= time / 0.5;
			}
			if (state == VoiceState::RELEASE) {
				alphaControl[i] *= fmax(0,1 - timeAfterNoteStop / 0.01);
			}
			//TODO: apply density to noise
		}


        for (int sample = 0; sample < numSamples; ++sample)
        {
            time += dt;
			float y = 0;

            for (int i = 0; i < param->num_partials; i++) {
				int n = i + 1;
				const float mag = magGlobal->sample(i, frameIdx) * magControl[i];
				ft[i] += frequency * n * dt;

				// limit 2 pi f t in -pi to pi
				if (ft[i] > 0.5) {
					ft[i] -= 1;
				}
				
				float alphaLocal;
				{
					// calculate alphaLocal
					float c1 = param->alphaLocalSpreadingCenter[i * 2];
					float c2 = param->alphaLocalSpreadingCenter[i * 2 + 1];
					float fac1 = param->alphaLocalSpreadingFactor[i * 2];
					float fac2 = param->alphaLocalSpreadingFactor[i * 2 + 1];
					float noiseGain1 = param->alphaLocalNoiseGain[i * 2];
					float noiseGain2 = param->alphaLocalNoiseGain[i * 2 + 1];
					float env1 = alphaLocalEnv1->sample(i, frameIdx);
					float env2 = alphaLocalEnv2->sample(i, frameIdx);
					float alphaLocalGain = param->alphaLocalGain[i];


					float phase1 = noiseSampler1->sample(frameIdx + noiseSampleShifts[i*2]);
					float phase2 = noiseSampler2->sample(frameIdx + noiseSampleShifts[i*2+1]);

					//alpha_local = np.sin(2 * np.pi * c1 * t_sus + fac1 * phase1) * env1 * ng1 \
					//	+ np.sin(2 * np.pi * c2 * t_sus + fac2 * phase2) * env2 * ng2

					float ft1, ft2;

					ft1 = c1 * time;
					ft1 = fmod(ft1, 1) - 0.5;

					ft2 = c2 * time;
					ft2 = fmod(ft2, 1) - 0.5;

					alphaLocal = juce::dsp::FastMathApproximations::sin(
						twoPi * ft1 + fac1 * phase1
					) * env1 * noiseGain1
					+ juce::dsp::FastMathApproximations::sin(
						twoPi * ft2 + fac2 * phase2
					) * env2 * noiseGain2;

					alphaLocal *= alphaLocalGain * alphaControl[i];
				}



				float alpha = alphaLocal + alphaGlobal->sample(i, frameIdx);
                float stuff_in_sin = twoPi * ft[i] + alpha;
				stuff_in_sin = stuff_in_sin - twoPi * juce::roundToInt(stuff_in_sin * recip_two_pi);
				y += mag * juce::dsp::FastMathApproximations::sin(stuff_in_sin);
            }
			
			if (state == VoiceState::RELEASE) {
                timeAfterNoteStop += dt;
				y *= exp(-timeAfterNoteStop * 20);
            }

			// If we are in the attack phase, apply the attack
            int attackU = juce::roundToInt(time * param->sampleRate);
            if (attackU < param->attackLen) {
                int startOverlap = param->attackLen - param->overlapLen;
                if (attackU > startOverlap) {
					float lerp = (attackU-(float)startOverlap) / param->overlapLen;
					float lerp1 = sqrtf(lerp);
					float lerp2 = sqrtf(1-lerp);
					// cosine crossfade
					//float lerp1 = sinf(lerp * float_Pi * 0.5);
					//float lerp2 = sinf((1 - lerp) * float_Pi * 0.5);
					y = param->attackWave[attackU]*getParam("attack") * attackFactor * intensity * lerp2 + y * lerp1;
                }
                else {
                    y = param->attackWave[attackU] * getParam("attack") * attackFactor * intensity;
                }
            }


			// debug the noise

			//y = noise[frameIdx % 80000] * 0.5;
			//y = noiseSampler->sample(frameIdx) * 0.5;

			// apply vibrato
			
			y *= 1 + 0.5 * vibratoValue;

			y *= velocity;

            for (int channel = 0; channel < outputBuffer.getNumChannels(); ++channel)
            {
				outputBuffer.addSample(channel, startSample, y * gain * 0.2);
            }
            ++startSample;
			++frameIdx;
        }
    }


private:

	AudioProcessorValueTreeState* valueTree;

    float time = 0;
	std::vector<float> ft = std::vector<float>(100);
    int pitch;
    double velocity;
    double baseFrequency;

    float timeAfterNoteStop;
	enum VoiceState state = VoiceState::IDLE;

	std::map<int, std::shared_ptr<MFMParam>>* mfmParams = nullptr;
    std::shared_ptr<MFMParam> param;
	std::unique_ptr<MultiChannelLoopSampler> magGlobal;
	std::unique_ptr<MultiChannelLoopSampler> alphaGlobal, alphaLocalEnv1, alphaLocalEnv2;
	std::unique_ptr<LoopSampler> noiseSampler1, noiseSampler2;

	std::map<juce::String, std::shared_ptr<MFMControl>>* mfmControls = nullptr;
	std::shared_ptr<MFMControl> control;

	std::map<int, juce::String>* channelToImage = nullptr;

	std::unique_ptr<TailSampler> intensityS, pitchS, densityS, hueS, saturationS, valueS;

	int* currentNoteChannel;
	int frameIdx = 0;

	float noise[80000];

	std::vector<float> noiseSampleShifts = std::vector<float>(100);

	void generateColoredNoise(float* buffer, int length, float cutoff) {
		Random r;
		for (int i = 0; i < length; i++) {
			buffer[i] = r.nextFloat() * 2 - 1;
		}

		juce::dsp::IIR::Filter<float> filter;
		filter.coefficients = juce::dsp::IIR::Coefficients<float>::makeLowPass(getSampleRate(), cutoff);
		juce::dsp::AudioBlock<float> block(&buffer, 1, length);
		juce::dsp::ProcessContextReplacing<float> context(block);
		filter.process(context);
		filter.process(context);
		filter.process(context);
		filter.process(context);
	}

	void setParam(AudioProcessorValueTreeState& valueTree, String paramId, float value)
	{
		//valueTree.getParameter(paramId)->beginChangeGesture();
		valueTree.getParameter(paramId)->setValueNotifyingHost(value);
		//valueTree.getParameter(paramId)->endChangeGesture();
	}

	float getParam(String paramId, float smooth_half_life = 0.0f) {
		if (lastParamValues.find(paramId) == lastParamValues.end()) {
			lastGetParamValueTime[paramId] = time;
			lastParamValues[paramId] = valueTree->getRawParameterValue(paramId)->load();
		}
		float value = valueTree->getRawParameterValue(paramId)->load();
		float lastValue = lastParamValues[paramId];
		float time = this->time;
		float lastTime = lastGetParamValueTime[paramId];
		float dt = time - lastTime;
		float smooth;
		if (dt < 0 || dt > 0.5) {
			smooth = 0;
		}
		else if (smooth_half_life < 0.01f) {
			smooth = 0;
		}
		else {
			smooth = pow(0.5, dt / smooth_half_life); // half life in seconds
		}

		lastParamValues[paramId] = value * (1 - smooth) + lastValue * smooth;
		lastGetParamValueTime[paramId] = time;
		return lastParamValues[paramId];
	}



	std::map<String, float> lastParamValues;
	std::map<String, float> lastGetParamValueTime;
};
