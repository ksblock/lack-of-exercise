import os
import sys
import pandas as pd
import numpy as np
import warnings; warnings.filterwarnings('ignore')
from sklearn.metrics.pairwise import cosine_similarity

def main(idx):
    def find_sim_gym(df, sorted_ind, gym_id, top_n=10):
        # 체육관 목록에서 추천에 사용할 체육관 찾기
        gym = df[df['id'] == gym_id]

        # 유사도 행렬에서 상위 10개 체육관 찾기 (자기 자신 제외) 
        gym_index = gym.index.values
        similar_indexes = sorted_ind[gym_index, 1:(top_n + 1)]

        #1차원 배열로 변환
        similar_indexes = similar_indexes.reshape(-1)
        return df.iloc[similar_indexes]

    gyms = pd.read_csv('recommendation/test3.csv', encoding='cp949') #체육관 목록
    sim_df = pd.read_csv('recommendation/sim.csv', encoding='UTF8') #유사도 행렬
    sim_sorted = sim_df.to_numpy()

    idx = int(idx)
    similar_gyms = find_sim_gym(gyms, sim_sorted, idx,10)

    return similar_gyms

if __name__ == '__main__':
    main(sys.argv[1])
