import sys
import json
import pandas as pd
import numpy as np
import warnings; warnings.filterwarnings('ignore')
from sklearn.metrics.pairwise import cosine_similarity

def main(new_data):
    #string을 dict로 변환
    new_data = eval(new_data)

    gyms = pd.read_csv('recommendation/test3.csv', index_col=0, encoding='UTF8')

    #기존 체육관 목록에 새 체육관 합치기
    input_df = pd.DataFrame(new_data, index=[gyms.shape[0]])
    gyms = pd.concat([gyms,input_df])

    gyms.to_csv('recommendation/test3.csv', mode='w')
    
    #거리 유사도 점수 가져오기
    dist = pd.read_csv('recommendation/dist_city.csv', encoding='cp949')
    index = pd.read_csv('recommendation/city_info.csv', encoding='cp949')
    dist = 1 - dist

    #종목 유사도 점수 가져오기
    dist_sports = pd.read_csv('recommendation/dist_sports.csv', encoding='cp949')
    index_sports = pd.read_csv('recommendation/sports_info.csv', encoding='UTF8')
    dist_sports = (dist_sports + 1) /2

    gym_df1 = gyms[['city']]
    gym_df2 = gyms[['price', 'court', 'player']]
    gym_df3 = gyms[['sports']]

    #운영 유사도 계산
    gym_df2_norm = (gym_df2 - gym_df2.mean())/gym_df2.std()
    sim_cos = cosine_similarity(gym_df2_norm, gym_df2_norm)
    sim_cos = (sim_cos + 1) /2

    def cal_dist(g1, g2):
        idx1 = index.iloc[0][g1]
        return dist.iloc[idx1][g2]

    #거리 유사도 계산
    temp2 = np.zeros((len(gym_df1), len(gym_df1)))
    for i in range(len(gym_df1)):
      for j in range(len(gym_df1)):
        temp2[i][j] = cal_dist(gym_df1.iloc[i].city, gym_df1.iloc[j].city)

    sim_city = pd.DataFrame(temp2)

    def cal_dist_sports(g1, g2):
        idx2 = index_sports.iloc[0][g1]
        return dist_sports.iloc[idx2][g2]

    #종목 유사도 계산
    temp3 = np.zeros((len(gym_df3), len(gym_df3)))
    for i in range(len(gym_df3)):
      for j in range(len(gym_df3)):
        temp3[i][j] = cal_dist_sports(gym_df3.iloc[i].sports, gym_df3.iloc[j].sports)

    sim_sports = pd.DataFrame(temp3)

    #유사도 합치기
    sim = sim_city * 5 + sim_sports * 3 + sim_cos * 2

    sim_temp = sim.to_numpy()
    sim_sorted = sim_temp.argsort()[:, ::-1]

    sim_df = pd.DataFrame(sim_sorted)
    sim_df.to_csv("recommendation/sim.csv", mode='w')

if __name__ == '__main__':
    main(sys.argv[1])
